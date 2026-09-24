import { describe, expect, it } from "vitest";
import { allocationMatchesTarget, targetAfterResolution, targetReserveA } from "@/lib/market/allocation";

describe("treasury allocation", () => {
  it("uses the same floor rule as the Compact circuit", () => {
    expect(targetReserveA(9_700n, 9_700n, 70n)).toBe(13_580n);
    expect(allocationMatchesTarget(9_700n, 9_700n, 70n)).toBe(false);
    expect(allocationMatchesTarget(13_580n, 5_820n, 70n)).toBe(true);
    expect(allocationMatchesTarget(0n, 0n, 70n)).toBe(true);
  });

  it("calculates the allocation argument for either winner and preserves a tie", () => {
    expect(targetAfterResolution(5, 3, 50n)).toBe(70n);
    expect(targetAfterResolution(3, 5, 50n)).toBe(30n);
    expect(targetAfterResolution(4, 4, 70n)).toBe(70n);
  });
});
