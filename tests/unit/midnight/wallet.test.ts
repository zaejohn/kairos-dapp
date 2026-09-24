import type { ConnectedAPI, InitialAPI } from "@midnight-ntwrk/dapp-connector-api";
import { afterEach, describe, expect, it, vi } from "vitest";
import { connectMidnightWallet, detectMidnightWallets, shortenAddress } from "@/lib/midnight/wallet";

afterEach(() => vi.unstubAllGlobals());

function provider(name: string, rdns: string, connected?: ConnectedAPI): InitialAPI {
  return { name, rdns, apiVersion: "4.0.1", connect: vi.fn().mockResolvedValue(connected) } as unknown as InitialAPI;
}

describe("Midnight wallets", () => {
  it("discovers only injected compatible 1AM and Lace providers", async () => {
    const oneAm = provider("1AM", "xyz.1am");
    const lace = provider("Lace", "io.lace.wallet");
    vi.stubGlobal("midnight", {
      opaqueOneAm: oneAm,
      opaqueLace: lace,
      old: { ...provider("Lace", "io.lace.wallet"), apiVersion: "3.0.0" },
      unrelated: provider("Another Wallet", "example.wallet"),
    });
    await expect(detectMidnightWallets()).resolves.toEqual([
      { id: "opaqueOneAm", name: "1AM", api: oneAm },
      { id: "opaqueLace", name: "LACE", api: lace },
    ]);
  });

  it("does not show a wallet that was not injected", async () => {
    vi.stubGlobal("midnight", { lace: provider("Lace", "io.lace.wallet") });
    expect((await detectMidnightWallets()).map((wallet) => wallet.name)).toEqual(["LACE"]);
  });

  it("starts the selected wallet approval request and waits for connection status and address", async () => {
    let approve: (api: ConnectedAPI) => void = () => { throw new Error("Approval was not requested"); };
    const connected = {
      getConnectionStatus: vi.fn().mockResolvedValue({ status: "connected", networkId: "preprod" }),
      getShieldedAddresses: vi.fn().mockResolvedValue({ shieldedAddress: "secret-address", shieldedCoinPublicKey: "11".repeat(32), shieldedEncryptionPublicKey: "22".repeat(32) }),
    } as unknown as ConnectedAPI;
    const oneAm = { ...provider("1AM", "xyz.1am"), connect: vi.fn().mockImplementation(() => new Promise<ConnectedAPI>((resolve) => { approve = resolve; })) } as InitialAPI;
    vi.stubGlobal("midnight", { opaque: oneAm });
    const [selected] = await detectMidnightWallets();
    const pending = connectMidnightWallet(selected!, "preprod");
    expect(oneAm.connect).toHaveBeenCalledWith("preprod");
    approve(connected);
    await expect(pending).resolves.toEqual({ name: "1AM", shieldedAddress: "secret-address", networkId: "preprod", coinPublicKey: "11".repeat(32), encryptionPublicKey: "22".repeat(32), api: connected });
  });

  it("rejects a wrong network after the wallet returns an API", async () => {
    const connected = {
      getConnectionStatus: vi.fn().mockResolvedValue({ status: "connected", networkId: "preview" }),
      getShieldedAddresses: vi.fn().mockResolvedValue({ shieldedAddress: "secret-address" }),
    } as unknown as ConnectedAPI;
    const lace = provider("Lace", "io.lace.wallet", connected);
    vi.stubGlobal("midnight", { opaque: lace });
    const [selected] = await detectMidnightWallets();
    await expect(connectMidnightWallet(selected!, "preprod")).rejects.toMatchObject({ code: "WALLET_WRONG_NETWORK" });
  });

  it("does not offer ambiguous duplicate providers", async () => {
    vi.stubGlobal("midnight", { first: provider("Lace", "io.lace.wallet"), second: provider("Lace", "io.lace.wallet") });
    await expect(detectMidnightWallets()).resolves.toEqual([]);
  });

  it("shortens long addresses without changing short values", () => {
    expect(shortenAddress("abcdefghijklmnopqrstu", 4)).toBe("abcd…rstu");
    expect(shortenAddress("short", 4)).toBe("short");
  });
});
