import { describe, expect, it } from "vitest";
import { getMidnightNetwork, isMidnightNetwork } from "@/lib/midnight/config";

describe("Midnight network config", () => {
  it.each(["undeployed", "preview", "preprod", "mainnet"])("accepts %s", (network) => {
    expect(isMidnightNetwork(network)).toBe(true);
    expect(getMidnightNetwork(network)).toBe(network);
  });

  it("rejects unknown networks", () => {
    expect(() => getMidnightNetwork("testnet")).toThrow(/Unsupported NEXT_PUBLIC_MIDNIGHT_NETWORK/);
  });
});
