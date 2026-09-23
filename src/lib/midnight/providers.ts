/**
 * Wires the Midnight DApp Connector to the midnight-js provider interfaces.
 *
 * The split of responsibility matters for privacy:
 *   - private state lives in page memory only (never persisted, never sent)
 *   - proving happens against the user's own local proof server
 *   - balancing and signing happen inside the wallet, which never hands over keys
 *   - only the finished transaction is broadcast
 */

import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import type {
  MidnightProviders,
  PrivateStateProvider,
} from '@midnight-ntwrk/midnight-js-types';
import type { ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { Transaction, SignatureEnabled, Proof, Binding } from '@midnight-ntwrk/midnight-js-protocol/ledger';

import { KAIROS_TAG, KAIROS_ZK_ASSETS_PATH, type KairosPrivateState } from '@/lib/contract/compiled';
import type { KairosCircuitId } from '@/lib/contract/circuits';
import type { ConnectedWallet } from './wallet';
import type { NetworkConfig } from './network';

// --- hex helpers -----------------------------------------------------------
// Kept local rather than pulling in another package: these are three lines and
// the conversion is unambiguous.

export const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

export const fromHex = (hex: string): Uint8Array => {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
};

// --- private state ---------------------------------------------------------

/**
 * Raised when something asks this provider to persist private state.
 *
 * KAIROS keeps position openings in page memory only, so backup and restore are
 * intentionally unavailable rather than quietly lossy.
 */
export class PrivateStatePersistenceUnsupported extends Error {
  constructor() {
    super(
      'KAIROS keeps private position state in memory only and does not export or import it. ' +
        'This is deliberate: the private state contains the opening of your position.',
    );
    this.name = 'PrivateStatePersistenceUnsupported';
  }
}

/**
 * In-memory private state provider.
 *
 * Private state is deliberately not persisted to localStorage or IndexedDB.
 * It holds the user's position opening (side, weight, nonce and secret), so
 * writing it to durable browser storage would leave it on disk beyond the
 * session. It is cleared on reload and on disconnect.
 */
export const createInMemoryPrivateStateProvider = (): PrivateStateProvider<
  string,
  KairosPrivateState
> => {
  const states = new Map<string, KairosPrivateState>();
  let contractAddress: ContractAddress | undefined;
  const signingKeys = new Map<string, unknown>();

  return {
    setContractAddress(address) {
      contractAddress = address;
    },
    async set(privateStateId, state) {
      states.set(privateStateId, state);
    },
    async get(privateStateId) {
      return states.get(privateStateId) ?? null;
    },
    async remove(privateStateId) {
      states.delete(privateStateId);
    },
    async clear() {
      states.clear();
    },
    async setSigningKey(address, signingKey) {
      signingKeys.set(String(address), signingKey);
    },
    async getSigningKey(address) {
      return (signingKeys.get(String(address)) ?? null) as never;
    },
    async removeSigningKey(address) {
      signingKeys.delete(String(address));
    },
    async clearSigningKeys() {
      signingKeys.clear();
    },

    // Export/import exist so a user can back private state up to durable
    // storage. This provider deliberately keeps nothing beyond the page
    // session, because the private state holds the opening of the user's
    // position. Refusing loudly is the honest behaviour: silently returning an
    // empty export would look like a successful backup that restores nothing.
    async exportPrivateStates() {
      throw new PrivateStatePersistenceUnsupported();
    },
    async importPrivateStates() {
      throw new PrivateStatePersistenceUnsupported();
    },
    async exportSigningKeys() {
      throw new PrivateStatePersistenceUnsupported();
    },
    async importSigningKeys() {
      throw new PrivateStatePersistenceUnsupported();
    },
  } satisfies PrivateStateProvider<string, KairosPrivateState>;
};

// --- full provider set -----------------------------------------------------

export type KairosProviders = MidnightProviders<
  KairosCircuitId,
  typeof KAIROS_TAG,
  KairosPrivateState
>;

/**
 * Build the provider set for a connected wallet.
 *
 * The proof server is always the local one. 1AM can also prove in-tab via
 * `getProvingProvider`, but routing private witness data through the local proof
 * server keeps the guarantee explicit — the witness values are what must never
 * leave the machine.
 */
export const buildKairosProviders = (
  wallet: ConnectedWallet,
  config: NetworkConfig,
): KairosProviders => {
  const zkConfigProvider = new FetchZkConfigProvider<KairosCircuitId>(
    `${window.location.origin}${KAIROS_ZK_ASSETS_PATH}`,
    fetch.bind(window),
  );

  const privateStateProvider = createInMemoryPrivateStateProvider();

  return {
    privateStateProvider,

    publicDataProvider: indexerPublicDataProvider(
      config.indexerUri,
      config.indexerWsUri,
    ),

    zkConfigProvider,

    proofProvider: httpClientProofProvider(
      config.proofServerUri,
      zkConfigProvider,
    ),

    walletProvider: {
      getCoinPublicKey: () => wallet.shieldedCoinPublicKey as never,
      getEncryptionPublicKey: () => wallet.shieldedEncryptionPublicKey as never,
      balanceTx: async (tx) => {
        const balanced = await wallet.api.balanceUnsealedTransaction(
          toHex(tx.serialize()),
        );
        return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
          'signature',
          'proof',
          'binding',
          fromHex(balanced.tx),
        );
      },
    },

    midnightProvider: {
      submitTx: async (tx) => {
        await wallet.api.submitTransaction(toHex(tx.serialize()));
        return tx.identifiers()[0];
      },
    },
  };
};
