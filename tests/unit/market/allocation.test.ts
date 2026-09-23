import { describe, expect, it } from "vitest";
import { allocationMatchesTarget, targetReserveA } from "@/lib/market/allocation";

describe("treasury allocation", () => {
  it("uses the same floor rule as the Compact circuit", () => {
    expect(targetReserveA(9_700n, 9_700n, 70n)).toBe(13_580n);
    expect(allocationMatchesTarget(9_700n, 9_700n, 70n)).toBe(false);
    expect(allocationMatchesTarget(13_580n, 5_820n, 70n)).toBe(true);
    expect(allocationMatchesTarget(0n, 0n, 70n)).toBe(true);
  });
});
