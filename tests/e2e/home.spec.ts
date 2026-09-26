import { expect, test, type Page } from "@playwright/test";

async function enterGarage(page: Page) {
  await page.getByRole("button", { name: "Enter the Garage" }).click();
  await expect(page.getByRole("dialog", { name: "KAIROS startup" })).toBeHidden();
}

test("offers entry when workshop artwork stalls", async ({ page }) => {
  await page.route("**/reference/home-image.png", async (route) => {
    await new Promise<void>((resolve) => page.once("close", () => resolve()));
    await route.abort().catch(() => {});
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Enter while artwork loads" })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Enter while artwork loads" }).click();
  await expect(page.getByRole("dialog", { name: "KAIROS startup" })).toBeHidden();
  await page.getByRole("button", { name: "Open Trading Engine" }).click();
  await expect(page.getByRole("heading", { name: "Commit your market view" })).toBeVisible();
});

test("retries a failed public state read from Trading Engine without a wallet", async ({ page }) => {
  let requests = 0;
  await page.route("https://indexer.preprod.midnight.network/api/v4/graphql", async (route) => {
    requests++;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { contractAction: null } }) });
  });
  await page.goto("/");
  await enterGarage(page);
  await page.getByRole("button", { name: "Open Settings" }).click();
  await page.getByText("Local developer controls").click();
  await page.getByLabel("Preprod contract address").fill("a".repeat(64));
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Open Trading Engine" }).click();
  await page.getByRole("button", { name: "Refresh market state" }).click();
  await expect(page.getByText(/Public market state could not be refreshed/)).toBeVisible();
  const afterFirst = requests;
  await page.getByRole("button", { name: "Refresh market state" }).click();
  await expect.poll(() => requests).toBeGreaterThan(afterFirst);
  await expect(page.getByText(/Public market state could not be refreshed/)).toBeVisible();
});

test("shows only the workshop and footer on desktop, with usable image stations", async ({ page }) => {
  await page.goto("/");
  await enterGarage(page);
  await expect(page.getByRole("img", { name: /Kairos workshop/ })).toBeVisible();
  await expect(page.locator("main > footer")).toBeVisible();
  await expect(page.locator("main > .home-artwork")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Kairos stations" })).toBeHidden();
  await page.getByRole("button", { name: "Open Trading Engine" }).click();
  await expect(page.getByRole("heading", { name: "Commit your market view" })).toBeVisible();
  await expect(page.getByRole("figure", { name: "Live NIGHT/USDT spot candlestick chart" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Market status" }).locator("strong").first()).toHaveCSS("color", "rgb(255, 241, 214)");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Open Wallet" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "No compatible Midnight wallets detected." })).toBeVisible();
  await expect(page.getByRole("button", { name: "LACE", exact: true })).toHaveCount(0);
});

test("mobile station navigation opens the matching dialogs", async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto("/");
  await enterGarage(page);
  await expect(page.getByRole("navigation", { name: "Kairos stations" })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForLoadState("networkidle");
  await page.getByRole("navigation", { name: "Kairos stations" }).getByRole("button", { name: /Treasury/ }).click();
  await expect(page.getByRole("dialog", { name: "Treasury" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "One result, one target" })).toBeVisible();
  await expect(page.getByText("ACCOUNTED NIGHT")).toBeVisible();
});

test("previews an opening in the browser without treating it as a finalized position", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Enter the Garage" }).click();
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Open Trading Engine" }).click();
  await page.getByText("My position files and receipts").click();
  await page.getByLabel("Preview a saved opening locally").setInputFiles({
    name: "kairos-opening-round-3.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({
      version: 1,
      contractAddress: "a".repeat(64),
      round: 3,
      side: 1,
      salt: "b".repeat(64),
    })),
  });
  await expect(page.getByText("Imported file · Unverified on-chain")).toBeVisible();
  await expect(page.getByText("Round 3 · Quote B")).toBeVisible();
  await expect(page.getByText("Connect the wallet used to submit your commitment to load saved receipts.")).toBeVisible();
  await expect(page.getByText("b".repeat(64))).toHaveCount(0);
});

test("restores public position receipts after refresh for the same wallet and contract", async ({ page }) => {
  const contract = "a".repeat(64);
  const walletAddress = "test-shielded-address";
  const txId = "c".repeat(64);
  await page.addInitScript(() => {
    Object.defineProperty(window, "midnight", {
      value: {
        lace: {
          rdns: "io.lace.wallet", apiVersion: "4.0.1",
          connect: async () => ({
            getConnectionStatus: async () => ({ status: "connected", networkId: "preprod" }),
            getShieldedAddresses: async () => ({ shieldedAddress: "test-shielded-address", shieldedCoinPublicKey: "11".repeat(32), shieldedEncryptionPublicKey: "22".repeat(32) }),
          }),
        },
      },
    });
  });
  await page.goto("/");
  await page.evaluate(({ key, saved }) => localStorage.setItem(key, JSON.stringify(saved)), {
    key: `kairos:preprod:position-receipts:v1:${walletAddress}:${contract}`,
    saved: [{ round: 3, receipt: { txId, blockHeight: 2700501 } }],
  });

  for (let visit = 0; visit < 2; visit++) {
    if (visit > 0) await page.reload();
    await page.getByRole("button", { name: "Enter the Garage" }).click();
    await page.getByRole("button", { name: "Open Settings" }).click();
    await page.getByText("Local developer controls").click();
    await page.getByLabel("Preprod contract address").fill(contract);
    await page.getByRole("button", { name: "Close dialog" }).click();
    await page.getByRole("button", { name: "Open Wallet" }).click();
    await page.getByRole("button", { name: "LACE", exact: true }).click();
    await page.getByRole("button", { name: "Open Trading Engine" }).click();
    await page.getByText("My position files and receipts").click();
    await expect(page.getByText("Round 3 · Quote in your opening file")).toBeVisible();
    await expect(page.getByText("Finalized in block 2700501")).toBeVisible();
    await expect(page.getByText(/Transaction c{8}/)).toBeVisible();
    await expect(page.getByText("Imported file · Unverified on-chain")).toHaveCount(0);
  }
});

test("explains Lace's Preprod network mismatch", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "midnight", {
      value: {
        "opaque-lace-provider-id": {
          name: "lace",
          rdns: "io.lace.wallet",
          apiVersion: "4.0.1",
          connect: async () => { throw { name: "APIError", code: "InvalidRequest", message: "Network ID mismatch" }; },
        },
      },
    });
  });
  await page.goto("/");
  await enterGarage(page);
  await page.getByRole("button", { name: "Open Wallet" }).click();
  await page.getByRole("button", { name: "LACE", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Wallet" })).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: "Switch to preprod and retry" })).toBeVisible();
});

test("loads verifier keys and reaches wallet balancing after confirming connection status", async ({ page }) => {
  const verifierResponses: number[] = [];
  page.on("response", (response) => {
    if (response.url().includes("/zk/kairos/keys/") && response.url().endsWith(".verifier")) {
      verifierResponses.push(response.status());
    }
  });
  await page.addInitScript(() => {
    let checks = 0;
    Object.assign(window, { walletStatusChecks: () => checks });
    Object.defineProperty(window, "midnight", {
      value: {
        lace: {
          rdns: "io.lace.wallet",
          apiVersion: "4.0.1",
          connect: async () => ({
            getConnectionStatus: async () => {
              checks += 1;
              return { status: "connected", networkId: "preprod" };
            },
            getShieldedAddresses: async () => ({ shieldedAddress: "test-shielded-address", shieldedCoinPublicKey: "11".repeat(32), shieldedEncryptionPublicKey: "22".repeat(32) }),
          }),
        },
      },
    });
  });
  await page.goto("/");
  await enterGarage(page);
  await page.getByRole("button", { name: "Open Wallet" }).click();
  await page.getByRole("button", { name: "LACE", exact: true }).click();
  await page.getByRole("button", { name: "Open Settings" }).click();
  await page.getByLabel("Local storage password").fill("StrongLocalPassword123!");
  await page.getByRole("button", { name: "Save password" }).click();
  await page.getByText("Local developer controls").click();
  await page.getByRole("button", { name: "Deploy new Preprod contract" }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { walletStatusChecks: () => number }).walletStatusChecks())).toBe(2);
  await expect(page.getByRole("alert").filter({ hasText: "The wallet could not balance or authorize the transaction" })).toBeVisible();
  expect(verifierResponses).toHaveLength(8);
  expect(verifierResponses.every((status) => status === 200)).toBe(true);
  await expect(page.getByText("Submitted transaction ID:")).toHaveCount(0);
});

test("queries the Preprod indexer with browser fetch", async ({ page }) => {
  let indexerRequests = 0;
  await page.route("https://indexer.preprod.midnight.network/api/v4/graphql", async (route) => {
    indexerRequests++;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { contractAction: null } }) });
  });
  await page.goto("/");
  await enterGarage(page);
  await page.getByRole("button", { name: "Open Settings" }).click();
  await page.getByText("Local developer controls").click();
  await page.getByLabel("Preprod contract address").fill("a".repeat(64));
  await page.getByRole("button", { name: "Load public state" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Kairos contract was not found on Preprod" })).toBeVisible();
  expect(indexerRequests).toBeGreaterThan(0);
});

test("explains missing shielded keys at connection before deployment", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "midnight", {
      value: {
        lace: {
          rdns: "io.lace.wallet",
          apiVersion: "4.0.1",
          connect: async () => ({
            getConnectionStatus: async () => ({ status: "connected", networkId: "preprod" }),
            getShieldedAddresses: async () => ({ shieldedAddress: "test-shielded-address" }),
          }),
        },
      },
    });
  });
  await page.goto("/");
  await enterGarage(page);
  await page.getByRole("button", { name: "Open Wallet" }).click();
  await page.getByRole("button", { name: "LACE", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "did not provide valid preprod shielded public keys" })).toBeVisible();
  await expect(page.getByText("Submitted transaction ID:")).toHaveCount(0);
});

test("lists both injected wallets and connects only the selected provider", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "midnight", {
      value: {
        oneAm: {
          name: "1AM", rdns: "xyz.1am", apiVersion: "4.0.1",
          connect: async () => ({
            getConnectionStatus: async () => ({ status: "connected", networkId: "preprod" }),
            getShieldedAddresses: async () => ({ shieldedAddress: "test-shielded-address", shieldedCoinPublicKey: "11".repeat(32), shieldedEncryptionPublicKey: "22".repeat(32) }),
            getUnshieldedBalances: async () => ({ ["f".repeat(64)]: 4200n }),
          }),
        },
        lace: {
          name: "Lace", rdns: "io.lace.wallet", apiVersion: "4.0.1",
          connect: async () => { throw new Error("Lace should not be selected"); },
        },
      },
    });
  });
  await page.goto("/");
  await enterGarage(page);
  await page.getByRole("button", { name: "Open Wallet" }).click();
  await expect(page.getByRole("button", { name: "1AM", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "LACE", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "1AM", exact: true }).click();
  await expect(page.getByRole("button", { name: "Open Wallet" })).toBeEnabled();
  await expect(page.getByRole("dialog", { name: "Wallet" })).not.toBeVisible();
  await page.getByRole("button", { name: "Open Wallet" }).click();
  await expect(page.getByText("CONNECTED NETWORK · MIDNIGHT PREPROD")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy full shielded address" })).toContainText("test-shielded-address");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Open Settings" }).click();
  await page.getByRole("button", { name: "Refresh wallet balances" }).click();
  await expect(page.getByText("4200")).toBeVisible();
  await page.getByLabel("Local storage password").fill("StrongLocalPassword123!");
  await page.getByRole("button", { name: "Save password" }).click();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Open Wallet" }).click();
  await page.getByRole("button", { name: "Disconnect in Kairos" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Kairos session disconnected" })).toBeVisible();
  await expect(page.getByRole("button", { name: "1AM", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: "Open Settings" }).click();
  await expect(page.getByLabel("Local storage password")).toBeEmpty();
  await expect(page.getByText("No password saved in this tab.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Refresh wallet balances" })).toBeDisabled();
});
