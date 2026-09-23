/**
 * Midnight wallet connection over the DApp Connector API.
 *
 * KAIROS targets **1AM** (https://1am.xyz/), the Midnight-native wallet. 1AM
 * implements the same connector v4 surface as Lace, so the integration is the
 * standard one — the differences that matter are recorded below.
 *
 * Wallets inject themselves under `window.midnight[<key>]`. 1AM uses the
 * friendly key `'1am'`. Because several wallets can be installed at once
 * (1AM and Lace together, for example), detection enumerates rather than
 * assuming a single entry, and 1AM is preferred when present.
 *
 * Everything here is browser-only: the connector lives in the page, so none of
 * this may run on the server.
 */

import semver from 'semver';
import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';

import type { NetworkId } from './network';

/** Connector versions this dApp has been written against. */
const COMPATIBLE_CONNECTOR_RANGE = '4.x';

/**
 * The injection key 1AM uses under `window.midnight`. Checked first so that
 * installing another wallet alongside 1AM does not silently change which one
 * the dApp talks to.
 */
export const PREFERRED_WALLET_KEY = '1am';

type MidnightWindow = Window & {
  midnight?: Record<string, unknown>;
};

export type DetectedWallet = {
  /** The key this wallet is injected under, e.g. `'1am'`. */
  readonly key: string;
  readonly api: InitialAPI;
};

const isInitialApi = (candidate: unknown): candidate is InitialAPI => {
  if (!candidate || typeof candidate !== 'object') return false;
  const wallet = candidate as Partial<InitialAPI>;
  return (
    typeof wallet.apiVersion === 'string' &&
    typeof wallet.connect === 'function' &&
    typeof wallet.name === 'string'
  );
};

/** Wallet entries the page can see, without connecting to any of them. */
export const detectWallets = (): DetectedWallet[] => {
  if (typeof window === 'undefined') return [];

  const injected = (window as MidnightWindow).midnight;
  if (!injected || typeof injected !== 'object') return [];

  return Object.entries(injected)
    .filter(([, candidate]) => isInitialApi(candidate))
    .map(([key, candidate]) => ({ key, api: candidate as InitialAPI }));
};

export const isCompatible = (wallet: InitialAPI): boolean =>
  semver.satisfies(wallet.apiVersion, COMPATIBLE_CONNECTOR_RANGE);

/** 1AM first, then any other compatible connector. */
export const selectWallet = (wallets: DetectedWallet[]): DetectedWallet | undefined => {
  const compatible = wallets.filter((wallet) => isCompatible(wallet.api));
  return (
    compatible.find((wallet) => wallet.key.toLowerCase() === PREFERRED_WALLET_KEY) ??
    compatible[0]
  );
};

export class WalletError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'WalletError';
  }
}

/**
 * Wait for a wallet extension to inject itself.
 *
 * Extensions inject asynchronously after page load, so a cold load can race the
 * injection. This polls briefly before giving up.
 */
const waitForWallet = async (timeoutMs = 3000): Promise<DetectedWallet | undefined> => {
  const deadline = Date.now() + timeoutMs;

  for (;;) {
    const wallet = selectWallet(detectWallets());
    if (wallet) return wallet;
    if (Date.now() >= deadline) return undefined;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
};

export type ConnectedWallet = {
  readonly api: ConnectedAPI;
  /** The connector's own display name, e.g. "1AM". */
  readonly name: string;
  /** The network the wallet itself reports being on. */
  readonly walletNetworkId: string;
  readonly shieldedCoinPublicKey: string;
  readonly shieldedEncryptionPublicKey: string;
  readonly shieldedAddress: string;
  readonly unshieldedAddress: string;
  /** Present only when the wallet exposes a proving server URI. */
  readonly proverServerUri?: string;
  /**
   * Whether the wallet can generate proofs itself via `getProvingProvider`.
   *
   * 1AM implements this (WASM proving in-tab); Lace does not. KAIROS proves
   * against the local proof server either way, so that proofs are generated on
   * the user's own machine rather than a third party's — but the capability is
   * surfaced so the UI can say which path is in play.
   */
  readonly supportsDelegatedProving: boolean;
};

/**
 * Connect to a wallet and verify it is on the network this dApp targets.
 *
 * A mismatch is surfaced rather than silently tolerated: proving against the
 * wrong network produces transactions the target network will reject.
 */
export const connectWallet = async (networkId: NetworkId): Promise<ConnectedWallet> => {
  const wallet = await waitForWallet();

  if (!wallet) {
    throw new WalletError(
      'No compatible Midnight wallet detected. Install 1AM (https://1am.xyz/) and reload the page.',
    );
  }

  let api: ConnectedAPI;
  try {
    // Must be called directly from the user gesture: awaiting anything before
    // this lets the browser treat the auth pop-up as unsolicited and block it.
    api = await wallet.api.connect(networkId);
  } catch (cause) {
    throw new WalletError(`${wallet.api.name} rejected the connection request.`, cause);
  }

  const status = await api.getConnectionStatus();
  if (status.status !== 'connected') {
    throw new WalletError('The wallet reports that it is not connected.');
  }

  if (status.networkId !== networkId) {
    throw new WalletError(
      `Network mismatch: this app targets "${networkId}" but ${wallet.api.name} is on ` +
        `"${status.networkId}". Switch networks in the wallet and reconnect.`,
    );
  }

  const [shielded, unshielded, configuration] = await Promise.all([
    api.getShieldedAddresses(),
    api.getUnshieldedAddress(),
    api.getConfiguration(),
  ]);

  return {
    api,
    name: wallet.api.name,
    walletNetworkId: status.networkId,
    shieldedCoinPublicKey: shielded.shieldedCoinPublicKey,
    shieldedEncryptionPublicKey: shielded.shieldedEncryptionPublicKey,
    shieldedAddress: shielded.shieldedAddress,
    unshieldedAddress: unshielded.unshieldedAddress,
    proverServerUri: configuration.proverServerUri,
    // Feature-detected rather than assumed: coverage varies by wallet.
    supportsDelegatedProving:
      typeof (api as { getProvingProvider?: unknown }).getProvingProvider === 'function',
  };
};

/** Shorten an address for display without hiding which network it belongs to. */
export const truncateAddress = (address: string, lead = 10, tail = 6): string =>
  address.length <= lead + tail + 1
    ? address
    : `${address.slice(0, lead)}…${address.slice(-tail)}`;
