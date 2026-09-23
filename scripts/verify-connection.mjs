#!/usr/bin/env node
/**
 * Reproduce the wallet-connect path against the deployed Preprod contract.
 *
 * This exists because "connect failed with `No private state found at private
 * state ID 'kairos'`" is a failure that typechecking cannot catch: both shapes
 * of `findDeployedContract` are type-valid, and only one of them works when the
 * private state provider starts empty.
 *
 * It runs the same call the hook makes, twice — once the way that failed, and
 * once the way that is supposed to work — so the difference is demonstrated
 * rather than asserted.
 *
 * Uses a stub wallet provider: connecting a real wallet needs a browser, and
 * none of the wallet calls are reached while attaching to an existing contract.
 *
 * Usage: node scripts/verify-connection.mjs [contractAddress]
 * Read-only.
 */

import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';

import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { Contract } from '../managed/kairos/contract/index.js';
import { witnesses, emptyKairosPrivateState } from '../src/lib/contract/witnesses.ts';

const DEFAULT_ADDRESS =
  '89001d3f0ddb1b1d9e30fb1fa34f3c26658f5ba20bb6c25870e18dac5bbba8e4';

const address = process.argv[2] ?? DEFAULT_ADDRESS;
const KAIROS_TAG = 'kairos';
const PROOF_SERVER = 'http://localhost:6300';

setNetworkId('preprod');

/**
 * A fresh in-memory private state provider — deliberately empty, mirroring what
 * buildKairosProviders hands to findDeployedContract on a real connect.
 */
const emptyPrivateStateProvider = () => {
  const states = new Map();
  let contractAddress;
  const signingKeys = new Map();
  return {
    setContractAddress(a) {
      contractAddress = a;
    },
    async set(id, state) {
      states.set(id, state);
    },
    async get(id) {
      return states.get(id) ?? null;
    },
    async remove(id) {
      states.delete(id);
    },
    async clear() {
      states.clear();
    },
    async setSigningKey(a, k) {
      signingKeys.set(String(a), k);
    },
    async getSigningKey(a) {
      return signingKeys.get(String(a)) ?? null;
    },
    async removeSigningKey(a) {
      signingKeys.delete(String(a));
    },
    async clearSigningKeys() {
      signingKeys.clear();
    },
    async exportPrivateStates() {
      throw new Error('unsupported');
    },
    async importPrivateStates() {
      throw new Error('unsupported');
    },
    async exportSigningKeys() {
      throw new Error('unsupported');
    },
    async importSigningKeys() {
      throw new Error('unsupported');
    },
    _states: states,
  };
};

const buildProviders = () => {
  // Node has no fetch-bound window; the browser passes fetch.bind(window).
  // An absolute base URL is required — a bare '/zk' is rejected as invalid.
  const zkConfigProvider = new FetchZkConfigProvider('http://localhost:3000/zk', fetch);
  return {
    privateStateProvider: emptyPrivateStateProvider(),
    publicDataProvider: indexerPublicDataProvider(
      'https://indexer.preprod.midnight.network/api/v4/graphql',
      'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
    ),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(PROOF_SERVER, zkConfigProvider),
    walletProvider: {
      getCoinPublicKey: () => '0'.repeat(64),
      getEncryptionPublicKey: () => '0'.repeat(64),
      balanceTx: async () => {
        throw new Error('not reached when attaching to a deployed contract');
      },
    },
    midnightProvider: {
      submitTx: async () => {
        throw new Error('not reached when attaching to a deployed contract');
      },
    },
  };
};

const compiled = CompiledContract.make(KAIROS_TAG, Contract).pipe(
  CompiledContract.withWitnesses(witnesses),
);

const run = async (label, options) => {
  const providers = buildProviders();
  try {
    const found = await findDeployedContract(providers, {
      compiledContract: compiled,
      contractAddress: address,
      ...options,
    });
    const stored = providers.privateStateProvider._states.get(KAIROS_TAG);
    console.log(`  ${label}`);
    console.log(`    ✓ attached`);
    console.log(`    private state stored under '${KAIROS_TAG}': ${stored ? 'yes' : 'no'}`);
    return { ok: true, found };
  } catch (error) {
    const message = String(error?.message ?? error);
    console.log(`  ${label}`);
    console.log(`    ✗ ${message.split('\n')[0]}`);
    return { ok: false, message };
  }
};

const main = async () => {
  console.log(`contract: ${address}\n`);

  console.log('A) privateStateId only — the shape that failed');
  const without = await run('(no initialPrivateState)', { privateStateId: KAIROS_TAG });

  console.log('\nB) privateStateId + initialPrivateState — the fix');
  const withSeed = await run('(emptyKairosPrivateState)', {
    privateStateId: KAIROS_TAG,
    initialPrivateState: emptyKairosPrivateState(),
  });

  console.log('');
  if (without.ok === false && withSeed.ok === true) {
    console.log('CONFIRMED: the missing initialPrivateState was the cause, and seeding it fixes it.');
    process.exit(0);
  }
  if (withSeed.ok) {
    console.log('The fixed form attaches successfully.');
    console.log(`(note: the unfixed form behaved differently than expected: ${without.ok ? 'it also succeeded' : without.message})`);
    process.exit(0);
  }
  console.error('NOT FIXED: seeding initialPrivateState did not make the connection succeed.');
  process.exit(1);
};

main().catch((error) => {
  console.error(`error: ${error.message}`);
  process.exit(1);
});
