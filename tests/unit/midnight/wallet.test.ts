import type { ConnectedAPI, InitialAPI } from "@midnight-ntwrk/dapp-connector-api";
import { afterEach, describe, expect, it, vi } from "vitest";
import { connectLace, shortenAddress } from "@/lib/midnight/wallet";

afterEach(() => vi.unstubAllGlobals());

describe("wallet helpers", () => {
  it("shortens long addresses without changing short values", () => {
    expect(shortenAddress("abcdefghijklmnopqrstu", 4)).toBe("abcd…rstu");
    expect(shortenAddress("short", 4)).toBe("short");
  });

  it("rejects a wallet that reports the wrong network", async () => {
    const connected = {
      getConnectionStatus: vi.fn().mockResolvedValue({ status: "connected", networkId: "preview" }),
      getShieldedAddresses: vi.fn().mockResolvedValue({ shieldedAddress: "secret-address" }),
    } as unknown as ConnectedAPI;
    const initial = { connect: vi.fn().mockResolvedValue(connected) } as unknown as InitialAPI;
    vi.stubGlobal("midnight", { mnLace: Promise.resolve(initial) });
    await expect(connectLace("preprod")).rejects.toMatchObject({ code: "WALLET_WRONG_NETWORK" });
  });

  it("returns the connected API only after the Preprod status check", async () => {
    const connected = {
      getConnectionStatus: vi.fn().mockResolvedValue({ status: "connected", networkId: "preprod" }),
      getShieldedAddresses: vi.fn().mockResolvedValue({ shieldedAddress: "secret-address" }),
    } as unknown as ConnectedAPI;
    const initial = { connect: vi.fn().mockResolvedValue(connected) } as unknown as InitialAPI;
    vi.stubGlobal("midnight", { mnLace: Promise.resolve(initial) });
    await expect(connectLace("preprod")).resolves.toEqual({ shieldedAddress: "secret-address", api: connected });
  });
});
