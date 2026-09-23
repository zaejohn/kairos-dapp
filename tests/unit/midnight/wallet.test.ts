import { describe, expect, it } from "vitest";
import { shortenAddress } from "@/lib/midnight/wallet";

describe("wallet helpers", () => {
  it("shortens long addresses without changing short values", () => {
    expect(shortenAddress("abcdefghijklmnopqrstu", 4)).toBe("abcd…rstu");
    expect(shortenAddress("short", 4)).toBe("short");
  });
});
