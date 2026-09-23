'use client';

/**
 * The single source of application state for KAIROS.
 *
 * Owns the wallet connection, the midnight-js providers, the deployed contract
 * handle and the public ledger read from the indexer. Every write goes through
 * a real circuit call and produces a real proof — nothing here simulates
 * protocol behaviour.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

import { ledger as decodeLedger, type Ledger } from '@managed/kairos/contract/index.js';
import { createKairosCompiledContract, KAIROS_TAG } from '@/lib/contract/compiled';
import {
  createKairosPrivateState,
  emptyKairosPrivateState,
  type KairosPrivateState,
} from '@/lib/contract/witnesses';
import { connectWallet, type ConnectedWallet, WalletError } from '@/lib/midnight/wallet';
import { buildKairosProviders, type KairosProviders } from '@/lib/midnight/providers';
import {
  DEFAULT_NETWORK_ID,
  KAIROS_CONTRACT_ADDRESS,
  getNetworkConfig,
} from '@/lib/midnight/network';

export type TxPhase =
  | { readonly kind: 'idle' }
  | { readonly kind: 'proving'; readonly label: string }
  | { readonly kind: 'submitted'; readonly label: string; readonly txId: string }
  | { readonly kind: 'confirmed'; readonly label: string; readonly txId: string }
  | { readonly kind: 'error'; readonly label: string; readonly message: string };

/**
 * Whether a transaction is in flight.
 *
 * True from the moment proving starts until the network has finalized the
 * transaction — deliberately wider than "we have submitted something".
 * The wallet refuses a second transaction while one is pending, so releasing
 * the UI at `submitted` produces an error the user cannot act on:
 *
 *   A transaction is already pending. Wait for it to confirm or expire
 *   before requesting another.
 */
export const isPending = (tx: TxPhase): boolean =>
  tx.kind === 'proving' || tx.kind === 'submitted';

/** How long to wait for finalization before releasing the UI regardless. */
const FINALIZE_TIMEOUT_MS = 120_000;

/**
 * Wait until the transaction is finalized.
 *
 * Bounded, because an indexer stall must not lock the app permanently — if
 * finalization cannot be observed in time the UI is released anyway and the
 * wallet's own pending-transaction guard remains the backstop.
 */
const waitForFinalization = async (
  providers: KairosProviders | null,
  txId: string | undefined,
): Promise<boolean> => {
  if (!providers || !txId) return false;

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      providers.publicDataProvider.watchForTxData(txId as never),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('finalization timeout')), FINALIZE_TIMEOUT_MS);
      }),
    ]);
    return true;
  } catch {
    return false;
  } finally {
    if (timer) clearTimeout(timer);
  }
};

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export type UseKairos = {
  readonly walletStatus: WalletStatus;
  readonly wallet: ConnectedWallet | null;
  readonly walletError: string | null;

  readonly contractAddress: string | null;
  readonly isDeployed: boolean;
  readonly ledger: Ledger | null;
  readonly ledgerError: string | null;

  readonly tx: TxPhase;
  /** The position this browser holds for the current market, if any. */
  readonly myPosition: KairosPrivateState | null;

  connect: () => Promise<void>;
  disconnect: () => void;
  deploy: () => Promise<void>;
  refresh: () => Promise<void>;

  submitPosition: (side: bigint, weight: bigint) => Promise<void>;
  revealPosition: () => Promise<void>;
  closeMarket: () => Promise<void>;
  settleMarket: () => Promise<void>;
  finalizeMarket: () => Promise<void>;
  startNextMarket: () => Promise<void>;
  flip: (direction: bigint, amount: bigint) => Promise<void>;
};

const messageOf = (error: unknown): string => {
  if (error instanceof WalletError) return error.message;
  if (error instanceof Error) return error.message;
  return String(error);
};

export const useKairos = (): UseKairos => {
  const config = useMemo(() => getNetworkConfig(DEFAULT_NETWORK_ID), []);

  const [walletStatus, setWalletStatus] = useState<WalletStatus>('disconnected');
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);

  const [contractAddress, setContractAddress] = useState<string | null>(
    KAIROS_CONTRACT_ADDRESS ?? null,
  );
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [ledgerError, setLedgerError] = useState<string | null>(null);
  const [tx, setTx] = useState<TxPhase>({ kind: 'idle' });

  // A filed position is only meaningful for the market it was filed in. The
  // market id is recorded alongside it so that once the market rolls over, the
  // stale entry stops being reported as "your position" — otherwise the panel
  // would claim a position exists in a market the user has not entered.
  const [filed, setFiled] = useState<{
    readonly position: KairosPrivateState;
    readonly marketId: bigint;
  } | null>(null);

  // midnight-js contract handles are imperative objects, not React state.
  const providersRef = useRef<KairosProviders | null>(null);
  const contractRef = useRef<Awaited<ReturnType<typeof findDeployedContract>> | null>(null);

  // Latest observed market id. Held in a ref so a submit can tag its position
  // with the market it was filed in without the callback being rebuilt on
  // every indexer poll.
  const marketIdRef = useRef<bigint | null>(null);
  useEffect(() => {
    marketIdRef.current = ledger?.marketId ?? null;
  }, [ledger]);

  // The network id is process-global inside midnight-js and must be set before
  // any provider is constructed.
  useEffect(() => {
    setNetworkId(config.networkId);
  }, [config.networkId]);

  // --- reads ---------------------------------------------------------------

  const refresh = useCallback(async () => {
    const providers = providersRef.current;
    if (!providers || !contractAddress) return;

    try {
      const state = await providers.publicDataProvider.queryContractState(
        contractAddress as never,
      );
      setLedger(state ? decodeLedger(state.data) : null);
      setLedgerError(null);
    } catch (error) {
      setLedgerError(messageOf(error));
    }
  }, [contractAddress]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Poll the indexer while connected. There is no push channel wired up here,
  // and a short poll keeps the treasury display honest after other participants
  // act without the complexity of a subscription lifecycle.
  useEffect(() => {
    if (walletStatus !== 'connected' || !contractAddress) return;
    const id = setInterval(() => void refresh(), 8000);
    return () => clearInterval(id);
  }, [walletStatus, contractAddress, refresh]);

  // --- wallet --------------------------------------------------------------

  const connect = useCallback(async () => {
    setWalletStatus('connecting');
    setWalletError(null);

    try {
      const connected = await connectWallet(config.networkId);
      const providers = buildKairosProviders(connected, config);

      providersRef.current = providers;
      setWallet(connected);
      setWalletStatus('connected');

      // Re-attach to an already deployed contract, if one is configured.
      if (contractAddress) {
        const compiled = createKairosCompiledContract();
        const found = await findDeployedContract(providers, {
          compiledContract: compiled as never,
          contractAddress: contractAddress as never,
          privateStateId: KAIROS_TAG,
          // `findDeployedContract` has two shapes: with `privateStateId` alone
          // it requires state to *already* exist under that id, and with
          // `initialPrivateState` it stores it. The private state provider is
          // created fresh here, so it is necessarily empty at this point and
          // the first form fails with "No private state found at private state
          // ID 'kairos'". Seeding it with an empty position satisfies the
          // store form and makes reconnecting work.
          //
          // An empty position is the correct seed: this browser holds no
          // position until one is submitted, and submitPosition replaces this
          // entry with the real (side, weight, nonce, secret) opening.
          initialPrivateState: emptyKairosPrivateState(),
        });
        contractRef.current = found;
      }
    } catch (error) {
      setWalletStatus('error');
      setWalletError(messageOf(error));
    }
  }, [config, contractAddress]);

  const disconnect = useCallback(() => {
    contractRef.current = null;
    providersRef.current = null;
    setWallet(null);
    setWalletStatus('disconnected');
    setWalletError(null);
    setLedger(null);
    setFiled(null);
    setTx({ kind: 'idle' });
  }, []);

  // --- writes --------------------------------------------------------------

  // Guards against two circuit calls overlapping. React state updates are
  // asynchronous, so a `tx.kind` check alone cannot stop a second click that
  // lands before the first render — the wallet would then reject the second
  // transaction as a duplicate.
  const inFlightRef = useRef(false);

  /**
   * Run a circuit call, tracking it through to finalization.
   *
   * The lock is released only once the transaction is finalized (or the wait
   * is abandoned as unobservable), never at submission.
   */
  const runCircuit = useCallback(
    async (label: string, call: () => Promise<{ public: { txId: string } }>) => {
      if (inFlightRef.current) {
        setTx({
          kind: 'error',
          label,
          message:
            'A transaction is already in progress. Wait for it to confirm before starting another.',
        });
        return;
      }

      inFlightRef.current = true;
      setTx({ kind: 'proving', label });

      try {
        const result = await call();
        const txId = result.public.txId;
        setTx({ kind: 'submitted', label, txId });

        // Hold the UI until the network has the transaction. Submitting is not
        // the same as landing, and the wallet rejects a new transaction while
        // one is still pending.
        const finalized = await waitForFinalization(providersRef.current, txId);
        setTx({ kind: 'confirmed', label, txId });

        if (!finalized) {
          // Confirmed as submitted, but finalization was not observed in time.
          // The state read below may therefore still lag.
          setLedgerError(
            'Transaction submitted, but confirmation took longer than expected. ' +
              'The displayed state may lag until the indexer catches up.',
          );
        }

        await refresh();
      } catch (error) {
        setTx({ kind: 'error', label, message: messageOf(error) });
      } finally {
        inFlightRef.current = false;
      }
    },
    [refresh],
  );

  const deploy = useCallback(async () => {
    const providers = providersRef.current;
    if (!providers) {
      setTx({ kind: 'error', label: 'Deploy', message: 'Connect a wallet first.' });
      return;
    }

    await runCircuit('Deploy contract', async () => {
      const compiled = createKairosCompiledContract();
      const initialPrivateState = createKairosPrivateState({ side: 0n, weight: 1n });

      const deployed = await deployContract(providers, {
        compiledContract: compiled as never,
        privateStateId: KAIROS_TAG,
        initialPrivateState,
        // The KAIROS constructor takes no arguments — it seeds the treasury,
        // tax rates and market state itself.
        args: [],
      });

      contractRef.current = deployed as never;
      const address = String(deployed.deployTxData.public.contractAddress);
      setContractAddress(address);
      return deployed.deployTxData as never;
    });
  }, [runCircuit]);

  const submitPosition = useCallback(
    async (side: bigint, weight: bigint) => {
      const providers = providersRef.current;
      const contract = contractRef.current;
      if (!providers || !contract) {
        setTx({ kind: 'error', label: 'Submit position', message: 'Connect a wallet first.' });
        return;
      }

      const marketId = marketIdRef.current;
      if (marketId === null) {
        setTx({
          kind: 'error',
          label: 'Submit position',
          message: 'Contract state has not loaded yet. Try again in a moment.',
        });
        return;
      }

      await runCircuit('Submit private position', async () => {
        // A fresh secret and nonce per position. The secret derives the
        // nullifier; the nonce keeps the commitment hiding.
        const privateState = createKairosPrivateState({ side, weight });
        await providers.privateStateProvider.set(KAIROS_TAG, privateState);
        setFiled({ position: privateState, marketId });

        return contract.callTx.submitPosition() as never;
      });
    },
    [runCircuit],
  );

  const revealPosition = useCallback(async () => {
    const contract = contractRef.current;
    if (!contract) {
      setTx({ kind: 'error', label: 'Reveal', message: 'Connect a wallet first.' });
      return;
    }
    await runCircuit('Reveal position', () => contract.callTx.revealPosition() as never);
  }, [runCircuit]);

  const closeMarket = useCallback(async () => {
    const contract = contractRef.current;
    if (!contract) {
      setTx({ kind: 'error', label: 'Close market', message: 'Connect a wallet first.' });
      return;
    }
    await runCircuit('Close market', () => contract.callTx.closeMarket() as never);
  }, [runCircuit]);

  const settleMarket = useCallback(async () => {
    const contract = contractRef.current;
    if (!contract) {
      setTx({ kind: 'error', label: 'Settle market', message: 'Connect a wallet first.' });
      return;
    }
    await runCircuit('Settle market', () => contract.callTx.settleMarket() as never);
  }, [runCircuit]);

  const finalizeMarket = useCallback(async () => {
    const contract = contractRef.current;
    if (!contract) {
      setTx({ kind: 'error', label: 'Finalize', message: 'Connect a wallet first.' });
      return;
    }
    await runCircuit('Finalize market', () => contract.callTx.finalizeMarket() as never);
  }, [runCircuit]);

  const startNextMarket = useCallback(async () => {
    const contract = contractRef.current;
    if (!contract) {
      setTx({ kind: 'error', label: 'Next market', message: 'Connect a wallet first.' });
      return;
    }
    await runCircuit('Start next market', () => contract.callTx.startNextMarket() as never);
  }, [runCircuit]);

  const flip = useCallback(
    async (direction: bigint, amount: bigint) => {
      const contract = contractRef.current;
      if (!contract) {
        setTx({ kind: 'error', label: 'Flip', message: 'Connect a wallet first.' });
        return;
      }
      await runCircuit(`Flip ${direction === 0n ? 'A → B' : 'B → A'}`, () =>
        contract.callTx.flip(direction, amount) as never,
      );
    },
    [runCircuit],
  );

  // Only report a position while the ledger is still on the market it was
  // filed for.
  const myPosition =
    filed && ledger && filed.marketId === ledger.marketId ? filed.position : null;

  return {
    walletStatus,
    wallet,
    walletError,
    contractAddress,
    isDeployed: contractAddress !== null,
    ledger,
    ledgerError,
    tx,
    myPosition,
    connect,
    disconnect,
    deploy,
    refresh,
    submitPosition,
    revealPosition,
    closeMarket,
    settleMarket,
    finalizeMarket,
    startNextMarket,
    flip,
  };
};
