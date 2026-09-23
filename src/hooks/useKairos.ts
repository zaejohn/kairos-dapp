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
import { createKairosPrivateState, type KairosPrivateState } from '@/lib/contract/witnesses';
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
  | { readonly kind: 'error'; readonly label: string; readonly message: string };

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

  /** Run a circuit call, tracking proving/submitted/error phases around it. */
  const runCircuit = useCallback(
    async (label: string, call: () => Promise<{ public: { txId: string } }>) => {
      setTx({ kind: 'proving', label });
      try {
        const result = await call();
        setTx({ kind: 'submitted', label, txId: result.public.txId });
        await refresh();
      } catch (error) {
        setTx({ kind: 'error', label, message: messageOf(error) });
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
