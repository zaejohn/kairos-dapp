import { describe, expect, it } from "vitest";
import { parseTradeAmount, tradeFee } from "@/lib/market/trading";

describe("transparent trade quoting", () => {
  it("accepts only whole Uint64 amounts at or above the circuit minimum", () => {
    expect(parseTradeAmount("100")).toBe(100n);
    expect(parseTradeAmount(((1n << 64n) - 1n).toString())).toBe((1n << 64n) - 1n);
    for (const value of ["0", "99", "01", "1.5", "-100", (1n << 64n).toString()]) {
      expect(() => parseTradeAmount(value)).toThrow();
    }
  });

  it("floors basis point fees as the contract constrains them", () => {
    expect(tradeFee(10_000n, 300n)).toBe(300n);
    expect(tradeFee(101n, 100n)).toBe(1n);
  });
});
