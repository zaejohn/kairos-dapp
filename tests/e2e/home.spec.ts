import { expect, test } from "@playwright/test";

test("renders the starter and wallet action", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("agentic development");
  await expect(page.getByRole("button", { name: "Connect Lace" })).toBeVisible();
});
