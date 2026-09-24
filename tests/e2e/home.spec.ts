import { expect, test } from "@playwright/test";

test("opens the market and wallet stations", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Market conviction");
  await page.getByRole("link", { name: "Open Market" }).click();
  await expect(page).toHaveURL(/#market$/);
  await expect(page.getByRole("heading", { name: "Commit your market view" })).toBeVisible();
  await page.getByRole("button", { name: "Connect Lace" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Midnight Lace is not available to this tab" })).toBeVisible();
});

test("mobile navigation exposes the same market feature", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Product stations" })).toBeVisible();
  await page.getByRole("navigation", { name: "Product stations" }).getByRole("link", { name: /Market/ }).click();
  await expect(page.getByRole("heading", { name: "Commit your market view" })).toBeVisible();
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
  await page.getByRole("button", { name: "Connect Lace" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Switch Lace to preprod and retry" })).toBeVisible();
});

test("clearing a Lace session removes private inputs from the page", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "midnight", {
      value: {
        "opaque-lace-provider-id": {
          name: "lace",
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
  await page.getByRole("button", { name: "Connect Lace" }).click();
  await expect(page.getByRole("button", { name: "Clear local session" })).toBeVisible();
  const marketChoice = page.getByRole("group", { name: "Quote-side choice" });
  await marketChoice.getByRole("button", { name: "Quote B" }).click();
  await page.getByRole("button", { name: "Sell quote", exact: true }).click();
  await page.getByRole("group", { name: "Trade quote side" }).getByRole("button", { name: "Quote B" }).click();
  await page.getByLabel("Gross amount in atomic units").fill("10000");
  await page.getByLabel("Local storage password").fill("PrivatePassphrase123!");
  await page.getByLabel("Private opening bundle").fill("private test data");
  await page.getByRole("button", { name: "Clear local session" }).click();
  await expect(page.getByLabel("Local storage password")).toHaveValue("");
  await expect(page.getByLabel("Private opening bundle")).toHaveValue("");
  await expect(page.getByLabel("Gross amount in atomic units")).toHaveValue("");
  await expect(marketChoice.getByRole("button", { name: "Quote A" })).toHaveClass(/selected/);
  await expect(marketChoice.getByRole("button", { name: "Quote B" })).not.toHaveClass(/selected/);
  await expect(page.getByRole("button", { name: "Buy quote", exact: true })).toHaveClass(/selected/);
  await expect(page.getByRole("group", { name: "Trade quote side" }).getByRole("button", { name: "Quote A" })).toHaveClass(/selected/);
  await expect(page.getByRole("button", { name: "Connect Lace" })).toBeVisible();
});
