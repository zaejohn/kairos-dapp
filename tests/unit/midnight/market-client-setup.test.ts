import { describe, expect, it, vi } from "vitest";
import { createMarketClient } from "@/lib/midnight/market-client";
import type { WalletConnection } from "@/lib/midnight/wallet";

describe("market client setup", () => {
  it("prepares providers with a connected Preprod wallet", async () => {
    const getConnectionStatus = vi.fn().mockResolvedValue({ status: "connected", networkId: "preprod" });
    const getShieldedAddresses = vi.fn().mockRejectedValue(new Error("Wallet service unavailable"));
    const wallet = {
      name: "LACE",
      shieldedAddress: "test-shielded-address",
      networkId: "preprod",
      coinPublicKey: "11".repeat(32),
      encryptionPublicKey: "22".repeat(32),
      api: { getConnectionStatus, getShieldedAddresses },
    } as unknown as WalletConnection;

    await expect(createMarketClient(wallet, "StrongLocalPassword123!", () => {})).resolves.toHaveProperty("deploy");
    expect(getConnectionStatus).toHaveBeenCalledOnce();
    expect(getShieldedAddresses).not.toHaveBeenCalled();
  });

  it("does not prepare providers when wallet status is unavailable", async () => {
    const wallet = {
      name: "LACE",
      shieldedAddress: "test-shielded-address",
      networkId: "preprod",
      coinPublicKey: "11".repeat(32),
      encryptionPublicKey: "22".repeat(32),
      api: { getConnectionStatus: vi.fn().mockRejectedValue(new Error("Wallet service unavailable")) },
    } as unknown as WalletConnection;

    await expect(createMarketClient(wallet, "StrongLocalPassword123!", () => {})).rejects.toMatchObject({
      code: "WALLET_STATUS_UNAVAILABLE",
    });
  });
});
