import { beforeEach, describe, expect, it } from "vitest";
import { loadPositionReceipts, savePositionReceipt } from "@/lib/market/position-receipts";

const contract = "a".repeat(64);
const otherContract = "b".repeat(64);
const wallet = "mn_addr_preprod1-wallet-a";

beforeEach(() => window.localStorage.clear());

describe("locally saved position receipts", () => {
  it("restores finalized public metadata after a reload without storing the private side or salt", () => {
    const submitted = {
      round: 2,
      receipt: { txId: "c".repeat(64), blockHeight: 2700501 },
      side: 1,
      salt: "d".repeat(64),
    };
    savePositionReceipt(window.localStorage, wallet, contract, submitted);

    expect(loadPositionReceipts(window.localStorage, wallet, contract)).toEqual([{
      round: 2,
      receipt: submitted.receipt,
    }]);
    expect(JSON.stringify(window.localStorage)).not.toContain(submitted.salt);
    expect(window.localStorage.getItem(window.localStorage.key(0)!)).not.toContain('"side"');
    expect(loadPositionReceipts(window.localStorage, "another-wallet", contract)).toEqual([]);
    expect(loadPositionReceipts(window.localStorage, wallet, otherContract)).toEqual([]);
  });

  it("deduplicates by transaction, keeps the newest eight, and rejects corrupt records", () => {
    for (let i = 0; i < 10; i++) {
      savePositionReceipt(window.localStorage, wallet, contract, {
        round: 1,
        receipt: { txId: i.toString(16).padStart(64, "0"), blockHeight: i },
      });
    }
    const saved = loadPositionReceipts(window.localStorage, wallet, contract);
    expect(saved).toHaveLength(8);
    const newest = saved[0];
    const oldest = saved[7];
    if (!newest || !oldest) throw new Error("Expected eight saved receipts");
    expect(newest.receipt.blockHeight).toBe(9);
    expect(oldest.receipt.blockHeight).toBe(2);
    savePositionReceipt(window.localStorage, wallet, contract, newest);
    expect(loadPositionReceipts(window.localStorage, wallet, contract)).toHaveLength(8);

    window.localStorage.setItem(window.localStorage.key(0)!, JSON.stringify([{ round: 1, receipt: { txId: "bad", blockHeight: 1 } }]));
    expect(() => loadPositionReceipts(window.localStorage, wallet, contract)).toThrow(/invalid/);
  });
});
