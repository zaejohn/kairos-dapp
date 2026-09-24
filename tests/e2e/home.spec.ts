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
  await page.getByLabel("Local storage password").fill("PrivatePassphrase123!");
  await page.getByLabel("Private opening bundle").fill("private test data");
  await page.getByRole("button", { name: "Clear local session" }).click();
  await expect(page.getByLabel("Local storage password")).toHaveValue("");
  await expect(page.getByLabel("Private opening bundle")).toHaveValue("");
  await expect(page.getByRole("button", { name: "Connect Lace" })).toBeVisible();
});
