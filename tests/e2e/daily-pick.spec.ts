import { expect, test } from "@playwright/test";

async function clearStoredDailyPick(page: import("@playwright/test").Page) {
  await page.evaluate(() => sessionStorage.removeItem("jothidam.daily-pick.v2"));
}

test.describe("daily pick", () => {
  test("first pick returns a card with streak and countdown", async ({ page }) => {
    await page.goto("/ta");

    await expect(page.getByTestId("daily-pick-button")).toBeEnabled();
    await page.getByTestId("daily-pick-button").click();

    await expect(page.getByTestId("fortune-card-face")).toBeVisible();
    await expect(page.getByTestId("daily-pick-countdown")).toContainText("IST");
    await expect(page.getByTestId("daily-pick-streak")).toContainText("1");
  });

  test("second pick on the same day shows the same card", async ({ page }) => {
    await page.goto("/ta");
    await clearStoredDailyPick(page);
    await page.reload();

    await page.getByTestId("daily-pick-button").click();
    const firstCard = await page.getByTestId("fortune-card-face").innerText();

    await page.getByTestId("daily-pick-button").click();

    await expect(page.getByTestId("fortune-card-face")).toHaveText(firstCard);
    await expect(page.getByTestId("daily-pick-result-summary")).toContainText(
      "இன்று நீங்கள் ஏற்கனவே",
    );
    await expect(page.getByTestId("daily-pick-button")).toBeDisabled();
  });

  test("language switch keeps the daily result", async ({ page }) => {
    await page.goto("/ta");
    await clearStoredDailyPick(page);
    await page.reload();

    await page.getByTestId("daily-pick-button").click();
    await expect(page.getByTestId("fortune-card-face")).toBeVisible();

    await page.getByTestId("language-switcher").click();

    await expect(page).toHaveURL(/\/en$/);
    await expect(page.getByTestId("fortune-card-face")).toBeVisible();
    await expect(page.getByTestId("daily-pick-countdown")).toContainText("IST");
    await expect(page.getByTestId("daily-pick-button")).toBeDisabled();
  });

  test("offline pick shows a network error and retry action", async ({ page, context }) => {
    await page.goto("/ta");
    await clearStoredDailyPick(page);
    await page.reload();

    await context.setOffline(true);
    await page.getByTestId("daily-pick-button").click();

    await expect(page.getByTestId("daily-pick-error")).toContainText(
      "இணைய இணைப்பில் சிக்கல்",
    );
    await expect(page.getByTestId("daily-pick-button")).toHaveText("மீண்டும் முயற்சிக்கவும்");
  });
});
