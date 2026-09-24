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
import { fromHex, parseCoinPublicKeyToHex, parseEncPublicKeyToHex, PasswordValidationError, toHex, validatePassword } from "@midnight-ntwrk/midnight-js-utils";
import { Contract, ledger, type Opening } from "../../../contracts/managed/kairos/contract/index.js";
import { AppError } from "@/lib/errors/app-error";
import { tradeFee, type QuoteSide, type TradeDirection } from "@/lib/market/trading";
import { targetAfterResolution, targetReserveA } from "@/lib/market/allocation";

const INDEXER_HTTP = "https://indexer.preprod.midnight.network/api/v4/graphql";
const INDEXER_WS = "wss://indexer.preprod.midnight.network/api/v4/graphql/ws";
const PROOF_SERVER = "http://127.0.0.1:6301";
type CircuitId = "commitPosition" | "resolveRound" | "expireRound" | "startNextRound" | "initializeEconomy" | "buyQuote" | "sellQuote" | "rebalanceTreasury";

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
  };
}

function walletProvider(api: ConnectedAPI): WalletProvider & MidnightProvider & { loadKeys(): Promise<{ coin: string; encryption: string }> } {
  let keys: { coin: string; encryption: string } | undefined;
  async function loadKeys() {
    if (!keys) {
      const addresses = await api.getShieldedAddresses();
      keys = {
        coin: parseCoinPublicKeyToHex(addresses.shieldedCoinPublicKey, "preprod"),
        encryption: parseEncPublicKeyToHex(addresses.shieldedEncryptionPublicKey, "preprod"),
      };
    }
    return keys;
  }
  // Midnight.js requires synchronous key access. Initialize before returning.
  return {
    getCoinPublicKey: () => {
      if (!keys) throw new AppError("WALLET_KEYS_UNAVAILABLE", "Reconnect Lace to load wallet keys.");
      return keys.coin;
    },
    getEncryptionPublicKey: () => {
      if (!keys) throw new AppError("WALLET_KEYS_UNAVAILABLE", "Reconnect Lace to load wallet keys.");
      return keys.encryption;
    },
    async balanceTx(tx: UnboundTransaction): Promise<FinalizedTransaction> {
      const balanced = await api.balanceUnsealedTransaction(toHex(tx.serialize()));
      return Transaction.deserialize("signature", "proof", "binding", fromHex(balanced.tx));
    },
    async submitTx(tx: FinalizedTransaction): Promise<string> {
      await api.submitTransaction(toHex(tx.serialize()));
      const txId = tx.identifiers()[0];
      if (!txId) throw new AppError("TX_ID_MISSING", "Lace submitted the transaction without an identifier.");
      return txId;
    },
    loadKeys,
  };
}

export async function createMarketClient(api: ConnectedAPI, accountId: string, password: string) {
  if (typeof window === "undefined") throw new AppError("BROWSER_ONLY", "The market is available only in a browser.");
  try {
    validatePassword(password);
  } catch (cause) {
    if (cause instanceof PasswordValidationError) {
      throw new AppError("PASSWORD_INVALID", "Enter a stronger local storage password: 16+ characters, three character types, and no simple repeats or sequences.");
    }
    throw cause;
  }
  const status = await api.getConnectionStatus();
  if (status.status !== "connected" || status.networkId !== "preprod") {
    throw new AppError("WALLET_WRONG_NETWORK", "Connect Lace to Midnight Preprod before using the market.");
  }
  setNetworkId("preprod");
  const adapter = walletProvider(api);
  await adapter.loadKeys();
  const zkConfigProvider = new FetchZkConfigProvider<CircuitId>(`${window.location.origin}/zk/kairos`);
  const publicDataProvider = indexerPublicDataProvider(INDEXER_HTTP, INDEXER_WS);
  const providers: MidnightProviders<CircuitId, "kairos", undefined> = {
    privateStateProvider: levelPrivateStateProvider<"kairos", undefined>({
      accountId,
      midnightDbName: "kairos-preprod-v1",
      privateStateStoreName: "private-state",
      signingKeyStoreName: "signing-keys",
      privateStoragePasswordProvider: () => password,
    }),
    publicDataProvider,
    zkConfigProvider,
    proofProvider: httpClientProofProvider(PROOF_SERVER, zkConfigProvider),
    walletProvider: adapter,
    midnightProvider: adapter,
  };
  const compiledContract = CompiledContract.withCompiledFileAssets(
    CompiledContract.withVacantWitnesses(CompiledContract.make<Contract<undefined>, undefined>("kairos", Contract)),
    "/zk/kairos",
  );

  async function found(contractAddress: string) {
    return findDeployedContract(providers, { compiledContract, contractAddress });
  }

  async function payoutAddress() {
    const { unshieldedAddress } = await api.getUnshieldedAddress();
    try {
      const decoded = MidnightBech32m.parse(unshieldedAddress).decode(UnshieldedAddress, "preprod");
      return { bytes: encodeUserAddress(decoded.hexString) };
    } catch (cause) {
      throw new AppError("UNSHIELDED_ADDRESS_INVALID", "Lace returned an invalid Preprod unshielded address.", { cause });
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
