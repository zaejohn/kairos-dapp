import { describe, expect, it } from "vitest";
import { createOpening, parseOpening, parseResolutionBundle } from "@/lib/market/openings";

const address = "a".repeat(64);

describe("private opening files", () => {
  it("creates a 32-byte random salt and parses its local backup", () => {
    const saved = createOpening(address, 1, 0);
    expect(saved.salt).toMatch(/^[0-9a-f]{64}$/);
    expect(parseOpening(saved)).toEqual(saved);
  });

  it("rejects wrong round, malformed salt, and incomplete resolution", () => {
    const openings = Array.from({ length: 8 }, () => createOpening(address, 1, 1));
    expect(() => parseResolutionBundle(JSON.stringify(openings), address, 2n)).toThrow(/current contract and round/);
    expect(() => parseResolutionBundle(JSON.stringify(openings.slice(1)), address, 1n)).toThrow(/Exactly eight/);
    expect(() => parseOpening({ ...openings[0], salt: "00" })).toThrow(/invalid/);
  });
});
