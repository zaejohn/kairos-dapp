export function targetReserveA(reserveA: bigint, reserveB: bigint, targetA: bigint): bigint {
  return (reserveA + reserveB) * targetA / 100n;
}

export function allocationMatchesTarget(reserveA: bigint, reserveB: bigint, targetA: bigint): boolean {
  return reserveA === targetReserveA(reserveA, reserveB, targetA);
}
