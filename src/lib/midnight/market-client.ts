"use client";

import type { ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";
import { deployContract, findDeployedContract } from "@midnight-ntwrk/midnight-js-contracts";
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";
import { Transaction, type FinalizedTransaction } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { encodeUserAddress } from "@midnight-ntwrk/compact-runtime";
import { MidnightBech32m, UnshieldedAddress } from "@midnight-ntwrk/wallet-sdk-address-format";
import type { MidnightProvider, MidnightProviders, UnboundTransaction, WalletProvider } from "@midnight-ntwrk/midnight-js-types";
import { fromHex, PasswordValidationError, toHex, validatePassword } from "@midnight-ntwrk/midnight-js-utils";
import { Contract, ledger, type Opening } from "../../../contracts/managed/kairos/contract/index.js";
import { AppError } from "@/lib/errors/app-error";
import { tradeFee, type QuoteSide, type TradeDirection } from "@/lib/market/trading";
import { targetAfterResolution, targetReserveA } from "@/lib/market/allocation";
import { withTransactionProgress, type TransactionProgress } from "@/lib/midnight/transaction-progress";
import { walletFailureReason, type WalletConnection } from "@/lib/midnight/wallet";

const INDEXER_HTTP = "https://indexer.preprod.midnight.network/api/v4/graphql";
const INDEXER_WS = "wss://indexer.preprod.midnight.network/api/v4/graphql/ws";
const PROOF_SERVER = "http://127.0.0.1:6301";
type CircuitId = "commitPosition" | "resolveRound" | "expireRound" | "startNextRound" | "initializeEconomy" | "buyQuote" | "sellQuote" | "rebalanceTreasury";

export interface PublicTreasuryAction {
  index: bigint;
  round: bigint;
  kind: bigint;
  winner: bigint;
  targetA: bigint;
  targetB: bigint;
  reserveA: bigint;
  reserveB: bigint;
  feePool: bigint;
}

export interface MarketSnapshot {
  round: bigint;
  roundCloseAt: bigint;
  phase: bigint;
  positions: bigint;
  winner: bigint;
  targetA: bigint;
  targetB: bigint;
  economyIssued: boolean;
  quoteAColor: string;
  quoteBColor: string;
  kaiColor: string;
  reserveA: bigint;
  reserveB: bigint;
  feePool: bigint;
  kaiDistributed: bigint;
  buyFeeA: bigint;
  buyFeeB: bigint;
  sellFeeA: bigint;
  sellFeeB: bigint;
  treasuryActionCount: bigint;
  recentTreasuryActions: PublicTreasuryAction[];
}

export interface PublicTxReceipt {
  txId: string;
  blockHeight: number;
}

export async function readPublicMarket(contractAddress: string): Promise<MarketSnapshot> {
  setNetworkId("preprod");
  const publicDataProvider = indexerPublicDataProvider(INDEXER_HTTP, INDEXER_WS);
  const state = await publicDataProvider.queryContractState(contractAddress);
  if (!state) throw new AppError("CONTRACT_NOT_FOUND", "Kairos contract was not found on Preprod.");
  const view = ledger(state.data);
  const recentTreasuryActions = Array.from({ length: Number(view.treasuryActionCount > 10n ? 10n : view.treasuryActionCount) }, (_, offset) => {
    const index = view.treasuryActionCount - 1n - BigInt(offset);
    const action = view.treasuryActions.lookup(index);
    return { index, ...action };
  });
  return {
    round: view.round,
    roundCloseAt: view.roundCloseAt,
    phase: view.phase,
    positions: view.nextIndex,
    winner: view.winner,
    targetA: view.targetA,
    targetB: view.targetB,
    economyIssued: view.economyIssued,
    quoteAColor: toHex(view.quoteAColor),
    quoteBColor: toHex(view.quoteBColor),
    kaiColor: toHex(view.kaiColor),
    reserveA: view.reserveA,
    reserveB: view.reserveB,
    feePool: view.feePool,
    kaiDistributed: view.kaiDistributed,
    buyFeeA: view.buyFeeA,
    buyFeeB: view.buyFeeB,
    sellFeeA: view.sellFeeA,
    sellFeeB: view.sellFeeB,
    treasuryActionCount: view.treasuryActionCount,
    recentTreasuryActions,
  };
}

function walletProvider(api: ConnectedAPI, keys: { coin: string; encryption: string }): WalletProvider & MidnightProvider {
  return {
    getCoinPublicKey: () => keys.coin,
    getEncryptionPublicKey: () => keys.encryption,
    async balanceTx(tx: UnboundTransaction): Promise<FinalizedTransaction> {
      const balanced = await api.balanceUnsealedTransaction(toHex(tx.serialize()));
      return Transaction.deserialize("signature", "proof", "binding", fromHex(balanced.tx));
    },
    async submitTx(tx: FinalizedTransaction): Promise<string> {
      await api.submitTransaction(toHex(tx.serialize()));
      const txId = tx.identifiers()[0];
      if (!txId) throw new AppError("TX_ID_MISSING", "The wallet submitted the transaction without an identifier.");
      return txId;
    },
  };
}

function localStateProvider(wallet: WalletConnection, password: string) {
  return levelPrivateStateProvider<"kairos", undefined>({
    accountId: wallet.shieldedAddress,
    midnightDbName: "kairos-preprod-v1",
    privateStateStoreName: "private-state",
    signingKeyStoreName: "signing-keys",
    privateStoragePasswordProvider: () => password,
  });
}

export async function activateLocalStoragePassword(
  wallet: WalletConnection,
  contractAddress: string,
  currentPassword: string,
  nextPassword: string,
): Promise<{ existingKeyVerified: boolean }> {
  validatePassword(nextPassword);
  if (wallet.networkId !== "preprod") {
    throw new AppError("WALLET_WRONG_NETWORK", "Connect a Midnight wallet to Preprod before saving a local storage password.");
  }
  const provider = localStateProvider(wallet, nextPassword);
  try {
    // This contract has no application private state; the provider persists its
    // local contract signing key. Rotate that encrypted store before switching.
    if (currentPassword && currentPassword !== nextPassword) {
      await provider.changeSigningKeysPassword(() => currentPassword, () => nextPassword);
    }
    // A first-time deploy has no contract address yet. A wallet-scoped lookup
    // still checks browser storage without creating or replacing a signing key.
    const existingKey = await provider.getSigningKey(contractAddress || wallet.shieldedAddress);
    return { existingKeyVerified: existingKey != null };
  } catch (cause) {
    await provider.invalidateEncryptionCache();
    throw new AppError(
      "PASSWORD_STORAGE_UNAVAILABLE",
      "Could not unlock this wallet's encrypted local signing keys. If you used this browser before, enter the previous password first; also check browser storage access. The new password was not activated.",
      { cause },
    );
  }
}

export async function createMarketClient(wallet: WalletConnection, password: string, onProgress: (progress: TransactionProgress) => void = () => {}) {
  if (typeof window === "undefined") throw new AppError("BROWSER_ONLY", "The market is available only in a browser.");
  try {
    validatePassword(password);
  } catch (cause) {
    if (cause instanceof PasswordValidationError) {
      throw new AppError("PASSWORD_INVALID", "Enter a stronger local storage password: 16+ characters, three character types, and no simple repeats or sequences.");
    }
    throw cause;
  }
  if (wallet.networkId !== "preprod") {
    throw new AppError("WALLET_WRONG_NETWORK", "Connect a Midnight wallet to Preprod before using the market.");
  }
  let status: Awaited<ReturnType<ConnectedAPI["getConnectionStatus"]>>;
  try {
    status = await wallet.api.getConnectionStatus();
  } catch (cause) {
    const reason = walletFailureReason(cause);
    throw new AppError("WALLET_STATUS_UNAVAILABLE", `The wallet connection could not be confirmed${reason ? ` (${reason})` : ""}. Reconnect the wallet and retry.`, { cause });
  }
  if (status.status !== "connected" || status.networkId !== "preprod") {
    throw new AppError("WALLET_WRONG_NETWORK", "The wallet is no longer connected to Preprod. Reconnect it before using the market.");
  }
  setNetworkId("preprod");
  const adapter = walletProvider(wallet.api, { coin: wallet.coinPublicKey, encryption: wallet.encryptionPublicKey });
  const zkConfigProvider = new FetchZkConfigProvider<CircuitId>(`${window.location.origin}/zk/kairos`);
  const publicDataProvider = indexerPublicDataProvider(INDEXER_HTTP, INDEXER_WS);
  const transactionProviders = withTransactionProgress({
    proofProvider: httpClientProofProvider(PROOF_SERVER, zkConfigProvider),
    walletProvider: adapter,
    midnightProvider: adapter,
  }, onProgress);
  const providers: MidnightProviders<CircuitId, "kairos", undefined> = {
    privateStateProvider: localStateProvider(wallet, password),
    publicDataProvider,
    zkConfigProvider,
    ...transactionProviders,
  };
  const compiledContract = CompiledContract.withCompiledFileAssets(
    CompiledContract.withVacantWitnesses(CompiledContract.make<Contract<undefined>, undefined>("kairos", Contract)),
    "/zk/kairos",
  );

  async function found(contractAddress: string) {
    return findDeployedContract(providers, { compiledContract, contractAddress });
  }

  async function payoutAddress() {
    const { unshieldedAddress } = await wallet.api.getUnshieldedAddress();
    try {
      const decoded = MidnightBech32m.parse(unshieldedAddress).decode(UnshieldedAddress, "preprod");
      return { bytes: encodeUserAddress(decoded.hexString) };
    } catch (cause) {
      throw new AppError("UNSHIELDED_ADDRESS_INVALID", "The wallet returned an invalid Preprod unshielded address.", { cause });
    }
  }

  return {
    snapshot: readPublicMarket,
    async deploy() {
      const firstRoundCloseAt = BigInt(Math.floor(Date.now() / 1000) + 604_800);
      const deployed = await deployContract(providers, { compiledContract, args: [firstRoundCloseAt] });
      const publicData = deployed.deployTxData.public;
      return { contractAddress: publicData.contractAddress, receipt: { txId: publicData.txId, blockHeight: publicData.blockHeight } };
    },
    async commit(contractAddress: string, expectedRound: bigint, side: bigint, salt: Uint8Array): Promise<PublicTxReceipt> {
      const contract = await found(contractAddress);
      const result = await contract.callTx.commitPosition(expectedRound, side, salt);
      return { txId: result.public.txId, blockHeight: result.public.blockHeight };
    },
    async resolve(contractAddress: string, openings: Opening[]): Promise<PublicTxReceipt> {
      const state = await readPublicMarket(contractAddress);
      const forA = openings.filter((opening) => opening.side === 0n).length;
      const forB = openings.filter((opening) => opening.side === 1n).length;
      const targetA = targetAfterResolution(forA, forB, state.targetA);
      const candidateA = targetReserveA(state.reserveA, state.reserveB, targetA);
      const contract = await found(contractAddress);
      const result = await contract.callTx.resolveRound(openings, candidateA);
      return { txId: result.public.txId, blockHeight: result.public.blockHeight };
    },
    async expire(contractAddress: string): Promise<PublicTxReceipt> {
      const state = await readPublicMarket(contractAddress);
      const candidateA = targetReserveA(state.reserveA, state.reserveB, state.targetA);
      const contract = await found(contractAddress);
      const result = await contract.callTx.expireRound(candidateA);
      return { txId: result.public.txId, blockHeight: result.public.blockHeight };
    },
    async startNextRound(contractAddress: string): Promise<PublicTxReceipt> {
      const contract = await found(contractAddress);
      const result = await contract.callTx.startNextRound();
      return { txId: result.public.txId, blockHeight: result.public.blockHeight };
    },
    async initializeEconomy(contractAddress: string): Promise<PublicTxReceipt> {
      const contract = await found(contractAddress);
      const result = await contract.callTx.initializeEconomy();
      return { txId: result.public.txId, blockHeight: result.public.blockHeight };
    },
    async trade(contractAddress: string, side: QuoteSide, direction: TradeDirection, gross: bigint): Promise<PublicTxReceipt> {
      if (gross < 100n || gross > (1n << 64n) - 1n) throw new AppError("TRADE_AMOUNT_INVALID", "Enter 100 or more atomic units within the Uint64 limit.");
      const state = await readPublicMarket(contractAddress);
      if (!state.economyIssued) throw new AppError("ECONOMY_NOT_INITIALIZED", "Initialize the Kairos token economy first.");
      const bps = direction === "buy" ? (side === 0 ? state.buyFeeA : state.buyFeeB) : (side === 0 ? state.sellFeeA : state.sellFeeB);
      const fee = tradeFee(gross, bps);
      const recipient = await payoutAddress();
      const contract = await found(contractAddress);
      const result = direction === "buy"
        ? await contract.callTx.buyQuote(BigInt(side), gross, fee, recipient)
        : await contract.callTx.sellQuote(BigInt(side), gross, fee, recipient);
      return { txId: result.public.txId, blockHeight: result.public.blockHeight };
    },
    async rebalance(contractAddress: string): Promise<PublicTxReceipt> {
      const state = await readPublicMarket(contractAddress);
      if (state.phase !== 2n) throw new AppError("ROUND_NOT_RESOLVED", "Resolve the round before rebalancing.");
      const targetA = targetReserveA(state.reserveA, state.reserveB, state.targetA);
      const contract = await found(contractAddress);
      const result = await contract.callTx.rebalanceTreasury(targetA);
      return { txId: result.public.txId, blockHeight: result.public.blockHeight };
    },
  };
}
