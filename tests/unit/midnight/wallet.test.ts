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

  it("connects to Lace when the extension uses an opaque provider ID", async () => {
    const connected = {
      getConnectionStatus: vi.fn().mockResolvedValue({ status: "connected", networkId: "preprod" }),
      getShieldedAddresses: vi.fn().mockResolvedValue({ shieldedAddress: "secret-address" }),
    } as unknown as ConnectedAPI;
    const lace = {
      name: "lace",
      rdns: "io.lace.wallet",
      apiVersion: "4.0.1",
      connect: vi.fn().mockResolvedValue(connected),
    } as unknown as InitialAPI;
    const other = {
      name: "1AM",
      rdns: "com.midnight.1am",
      apiVersion: "4.0.0",
      connect: vi.fn(),
    } as unknown as InitialAPI;
    vi.stubGlobal("midnight", {
      "1am": other,
      "opaque-lace-id": lace,
    });

    await expect(connectLace("preprod")).resolves.toEqual({ shieldedAddress: "secret-address", api: connected });
    expect(lace.connect).toHaveBeenCalledWith("preprod");
    expect(other.connect).not.toHaveBeenCalled();
  });

  it("reports an incompatible Lace connector instead of saying the wallet is absent", async () => {
    vi.stubGlobal("midnight", {
      "opaque-id": { name: "lace", rdns: "io.lace.wallet", apiVersion: "3.0.0", connect: vi.fn() },
    });
    await expect(connectLace("preprod")).rejects.toMatchObject({ code: "WALLET_UNSUPPORTED_VERSION" });
  });

  it("rejects duplicate compatible Lace providers without connecting either one", async () => {
    const connect = vi.fn();
    const lace = { rdns: "io.lace.wallet", apiVersion: "4.0.1", connect };
    vi.stubGlobal("midnight", { first: lace, second: { ...lace } });

    await expect(connectLace("preprod")).rejects.toMatchObject({ code: "WALLET_AMBIGUOUS" });
    expect(connect).not.toHaveBeenCalled();
  });

  it("does not connect a different wallet under the legacy Lace key", async () => {
    const connect = vi.fn();
    vi.stubGlobal("midnight", { mnLace: { rdns: "example.other", apiVersion: "4.0.1", connect } });

    await expect(connectLace("preprod")).rejects.toMatchObject({ code: "WALLET_NOT_FOUND" });
    expect(connect).not.toHaveBeenCalled();
  });

  it("explains a network mismatch rejected by Lace during connect", async () => {
    const connect = vi.fn().mockRejectedValue({ name: "APIError", code: "InvalidRequest", message: "Network ID mismatch" });
    vi.stubGlobal("midnight", {
      "opaque-id": { name: "lace", rdns: "io.lace.wallet", apiVersion: "4.0.1", connect },
    });
    await expect(connectLace("preprod")).rejects.toMatchObject({
      code: "WALLET_WRONG_NETWORK",
      message: "Lace is on a different network. Switch Lace to preprod and retry.",
    });
    expect(connect).toHaveBeenCalledWith("preprod");
  });
});
