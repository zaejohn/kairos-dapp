/** Display helpers. Kept separate from the contract layer so nothing here can
 *  influence protocol arithmetic — these are presentation only. */

/** Basis points are the contract's unit; 10000 bps == 100%. */
export const BPS_TOTAL = 10_000n;

/**
 * Format basis points as a percentage.
 *
 * 5000n -> "50%"     2000n -> "20%"
 * 100n  -> "1%"      150n  -> "1.5%"
 *
 * Uses integer arithmetic on BigInt so it never touches the float path that the
 * contract deliberately avoids, and trims trailing zeros for display.
 */
export const formatBps = (bps: bigint, maxDecimals = 2): string => {
  const whole = bps / 100n;
  const remainder = bps % 100n;

  if (remainder === 0n) return `${whole}%`;

  const decimals = remainder.toString().padStart(2, '0').slice(0, maxDecimals);
  const trimmed = decimals.replace(/0+$/, '');
  return trimmed.length > 0 ? `${whole}.${trimmed}%` : `${whole}%`;
};

/** Group an integer with thousands separators, for demo-unit balances. */
export const formatAmount = (value: bigint): string =>
  value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/**
 * Split a two-way allocation into whole-percent widths for a bar, keeping the
 * two widths summing to exactly 100 so the bar never shows a gap or overflow.
 */
export const allocationWidths = (a: bigint, b: bigint): { a: number; b: number } => {
  const total = a + b;
  if (total === 0n) return { a: 50, b: 50 };

  const aWidth = Number((a * 100n) / total);
  return { a: aWidth, b: 100 - aWidth };
};
