/**
 * Lace wallet connection over the Midnight DApp Connector API.
 *
 * Wallets inject themselves under `window.midnight[<id>]`, and several can be
 * installed at once, so detection enumerates rather than assuming a single
 * entry. Everything here is browser-only: the connector is part of the page, so
 * none of this may run on the server.
 */

import semver from 'semver';
import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';

import type { NetworkId } from './network';

/** Connector versions this dApp has been written against. */
const COMPATIBLE_CONNECTOR_RANGE = '4.x';

type MidnightWindow = Window & {
  midnight?: Record<string, unknown>;
};

/** Wallet entries the page can see, without connecting to any of them. */
export const detectWallets = (): InitialAPI[] => {
  if (typeof window === 'undefined') return [];

  const injected = (window as MidnightWindow).midnight;
  if (!injected || typeof injected !== 'object') return [];

  return Object.values(injected).filter((candidate): candidate is InitialAPI => {
    if (!candidate || typeof candidate !== 'object') return false;
    const wallet = candidate as Partial<InitialAPI>;
    return (
      typeof wallet.apiVersion === 'string' &&
      typeof wallet.connect === 'function' &&
      typeof wallet.name === 'string'
    );
  });
};

export const isCompatible = (wallet: InitialAPI): boolean =>
  semver.satisfies(wallet.apiVersion, COMPATIBLE_CONNECTOR_RANGE);

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
const waitForWallet = async (timeoutMs = 3000): Promise<InitialAPI | undefined> => {
  const deadline = Date.now() + timeoutMs;

  for (;;) {
    const wallets = detectWallets().filter(isCompatible);
    if (wallets.length > 0) return wallets[0];
    if (Date.now() >= deadline) return undefined;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
};

export type ConnectedWallet = {
  readonly api: ConnectedAPI;
  /** The network the wallet itself reports being on. */
  readonly walletNetworkId: string;
  readonly shieldedCoinPublicKey: string;
  readonly shieldedEncryptionPublicKey: string;
  readonly shieldedAddress: string;
  readonly unshieldedAddress: string;
  /** Present only when the wallet exposes a proving server URI. */
  readonly proverServerUri?: string;
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
      'No compatible Midnight wallet detected. Install Lace and reload the page.',
    );
  }

  let api: ConnectedAPI;
  try {
    api = await wallet.connect(networkId);
  } catch (cause) {
    throw new WalletError('The wallet rejected the connection request.', cause);
  }

  const status = await api.getConnectionStatus();
  if (status.status !== 'connected') {
    throw new WalletError('The wallet reports that it is not connected.');
  }

  if (status.networkId !== networkId) {
    throw new WalletError(
      `Network mismatch: this app targets "${networkId}" but the wallet is on "${status.networkId}". ` +
        'Switch networks in Lace and reconnect.',
    );
  }

  const [shielded, unshielded, configuration] = await Promise.all([
    api.getShieldedAddresses(),
    api.getUnshieldedAddress(),
    api.getConfiguration(),
  ]);

  return {
    api,
    walletNetworkId: status.networkId,
    shieldedCoinPublicKey: shielded.shieldedCoinPublicKey,
    shieldedEncryptionPublicKey: shielded.shieldedEncryptionPublicKey,
    shieldedAddress: shielded.shieldedAddress,
    unshieldedAddress: unshielded.unshieldedAddress,
    proverServerUri: configuration.proverServerUri,
  };
};

/** Shorten an address for display without hiding which network it belongs to. */
export const truncateAddress = (address: string, lead = 10, tail = 6): string =>
  address.length <= lead + tail + 1
    ? address
    : `${address.slice(0, lead)}…${address.slice(-tail)}`;
