export type QuoteSide = 0 | 1;
export type TradeDirection = "buy" | "sell";

export function parseTradeAmount(value: string): bigint {
  if (!/^[1-9][0-9]*$/.test(value)) throw new Error("Enter a whole number of at least 100 atomic units.");
  const amount = BigInt(value);
  if (amount < 100n || amount > (1n << 64n) - 1n) throw new Error("Trade amount must be between 100 and the Uint64 limit.");
  return amount;
}

export function tradeFee(gross: bigint, basisPoints: bigint): bigint {
  return gross * basisPoints / 10_000n;
}
