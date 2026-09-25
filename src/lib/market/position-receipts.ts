import { isContractAddress } from "@/lib/market/openings";
import type { PublicTxReceipt } from "@/lib/midnight/market-client";

export interface PositionReceipt {
  round: number;
  receipt: PublicTxReceipt;
}

const TX_ID = /^[0-9a-f]{64}$/i;
const MAX_RECEIPTS = 8;

function storageKey(walletAddress: string, contractAddress: string): string {
  if (!walletAddress || !isContractAddress(contractAddress)) {
    throw new Error("A connected wallet and valid contract are required to access local receipts.");
  }
  return `kairos:preprod:position-receipts:v1:${walletAddress}:${contractAddress.toLowerCase()}`;
}

function isPositionReceipt(value: unknown): value is PositionReceipt {
  if (!value || typeof value !== "object") return false;
  const position = value as Record<string, unknown>;
  if (!position.receipt || typeof position.receipt !== "object") return false;
  const receipt = position.receipt as Record<string, unknown>;
  return typeof position.round === "number" && Number.isSafeInteger(position.round) && position.round > 0 &&
    typeof receipt.txId === "string" && TX_ID.test(receipt.txId) &&
    typeof receipt.blockHeight === "number" && Number.isSafeInteger(receipt.blockHeight) && receipt.blockHeight >= 0;
}

export function loadPositionReceipts(
  storage: Pick<Storage, "getItem">,
  walletAddress: string,
  contractAddress: string,
): PositionReceipt[] {
  const raw = storage.getItem(storageKey(walletAddress, contractAddress));
  if (raw === null) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every(isPositionReceipt)) {
    throw new Error("The locally saved receipts are invalid.");
  }
  return parsed.slice(0, MAX_RECEIPTS).map((position) => ({
    round: position.round,
    receipt: { txId: position.receipt.txId.toLowerCase(), blockHeight: position.receipt.blockHeight },
  }));
}

export function savePositionReceipt(
  storage: Pick<Storage, "getItem" | "setItem">,
  walletAddress: string,
  contractAddress: string,
  position: PositionReceipt,
): PositionReceipt[] {
  if (!isPositionReceipt(position)) throw new Error("A finalized receipt is required.");
  const previous = loadPositionReceipts(storage, walletAddress, contractAddress);
  const publicPosition: PositionReceipt = {
    round: position.round,
    receipt: { txId: position.receipt.txId.toLowerCase(), blockHeight: position.receipt.blockHeight },
  };
  const next = [publicPosition, ...previous.filter((entry) => entry.receipt.txId !== publicPosition.receipt.txId)].slice(0, MAX_RECEIPTS);
  // Only public round and transaction metadata are stored. The side and salt
  // remain in the user's downloaded opening file, never in browser storage.
  storage.setItem(storageKey(walletAddress, contractAddress), JSON.stringify(next));
  return next;
}
