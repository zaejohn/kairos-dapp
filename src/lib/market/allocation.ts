export function targetReserveA(reserveA: bigint, reserveB: bigint, targetA: bigint): bigint {
  return (reserveA + reserveB) * targetA / 100n;
}

export function targetAfterResolution(forA: number, forB: number, currentTargetA: bigint): bigint {
  return forA > forB ? 70n : forB > forA ? 30n : currentTargetA;
}

export function allocationMatchesTarget(reserveA: bigint, reserveB: bigint, targetA: bigint): boolean {
  return reserveA === targetReserveA(reserveA, reserveB, targetA);
}
