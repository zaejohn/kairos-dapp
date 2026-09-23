#!/usr/bin/env node
/**
 * Verify a deployed KAIROS contract against the Preprod indexer.
 *
 * Reads the contract state with the same public-data provider the dApp uses,
 * decodes it with the KAIROS ledger decoder from ./managed, and checks that the
 * result is actually a KAIROS contract in its expected initial state.
 *
 * This is the check that distinguishes "an address exists on chain" from "our
 * contract is deployed and readable" — decoding the state field-by-field is
 * what proves the latter.
 *
 * Usage:
 *   node scripts/verify-contract.mjs <contract-address-hex>
 *
 * Read-only.
 */

import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

// Relative, not the `@managed` alias: that alias is a TypeScript path mapping
// and plain Node would not resolve it.
import {
  ledger as decodeLedger,
  MarketState,
  Side,
} from '../managed/kairos/contract/index.js';

const ENDPOINT = 'https://indexer.preprod.midnight.network/api/v4/graphql';
const WS_ENDPOINT = 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws';

const address = process.argv[2];
if (!address) {
  console.error('usage: node scripts/verify-contract.mjs <contract-address-hex>');
  process.exit(1);
}

if (!/^[0-9a-f]{64}$/i.test(address)) {
  console.error(
    `refusing: "${address}" is not a 64-character hex contract address.\n` +
      'The Midnight SDK represents contract addresses as hex, not bech32 (mn1…).',
  );
  process.exit(1);
}

setNetworkId('preprod');

const main = async () => {
  console.log(`contract : ${address}`);
  console.log(`indexer  : ${ENDPOINT}\n`);

  const provider = indexerPublicDataProvider(ENDPOINT, WS_ENDPOINT);
  const state = await provider.queryContractState(address);

  if (!state) {
    console.error('NO CONTRACT STATE — the address did not resolve on Preprod.');
    console.error('Check the address, and that the deployment transaction is finalized.');
    process.exit(2);
  }

  console.log('state fetched from the indexer.');

  let l;
  try {
    l = decodeLedger(state.data);
  } catch (error) {
    console.error(`state did NOT decode as a KAIROS contract: ${error.message}`);
    console.error('The address resolves, but its ledger does not match this contract.');
    process.exit(3);
  }

  console.log('state decoded with the KAIROS ledger decoder.\n');
  console.log('--- on-chain ledger ---');
  console.log(`  marketId          ${l.marketId}`);
  console.log(`  marketState       ${MarketState[l.marketState]}`);
  console.log(`  allocA / allocB   ${l.allocA} / ${l.allocB}  (sum ${l.allocA + l.allocB})`);
  console.log(`  reserveA/reserveB ${l.reserveA} / ${l.reserveB}`);
  console.log(`  taxRateAtoB       ${l.taxRateAtoB} bps`);
  console.log(`  taxRateBtoA       ${l.taxRateBtoA} bps`);
  console.log(`  taxCollectedA/B   ${l.taxCollectedA} / ${l.taxCollectedB}`);
  console.log(`  tallyA / tallyB   ${l.tallyA} / ${l.tallyB}`);
  console.log(`  positionCount     ${l.positionCount}`);
  console.log(`  winner            ${Side[l.winner]}`);
  console.log(`  commitments       ${l.commitments.size()}`);
  console.log(`  revealedAt        ${l.revealedAt.size()}`);

  // The constructor's invariants: a fresh deployment must look exactly like this.
  const problems = [];
  if (l.allocA + l.allocB !== 10_000n) problems.push(`allocation invariant broken: ${l.allocA}+${l.allocB}`);
  if (l.marketId !== 1n) problems.push(`marketId is ${l.marketId}, expected 1`);
  if (l.marketState !== MarketState.OPEN) problems.push(`state is ${MarketState[l.marketState]}, expected OPEN`);
  if (l.taxRateAtoB !== 100n) problems.push(`taxRateAtoB is ${l.taxRateAtoB}, expected 100`);
  if (l.taxRateBtoA !== 300n) problems.push(`taxRateBtoA is ${l.taxRateBtoA}, expected 300`);

  console.log('');
  if (problems.length) {
    console.error('DECODED, but the state does not match a fresh KAIROS deployment:');
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(4);
  }

  console.log('VERIFIED: this is a KAIROS contract, freshly deployed, invariants intact.');
};

main().catch((error) => {
  console.error(`error: ${error.message}`);
  process.exit(1);
});
