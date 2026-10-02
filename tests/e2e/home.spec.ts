import { expect, test } from "@playwright/test";

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Create Next App|jothidam/i);
  await expect(page.getByRole("main")).toBeVisible();
});
