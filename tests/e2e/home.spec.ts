import { expect, test } from "@playwright/test";

test("default locale is Tamil at /ta", async ({ page }) => {
  await page.goto("/ta");
  await expect(
    page.getByRole("heading", { name: "கிலி ஜோதிடம்" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "என் அட்டையை எடு" }),
  ).toBeVisible();
});

test("language toggle keeps the same page and switches locale", async ({
  page,
  context,
}) => {
  await page.goto("/ta/collection");
  await expect(
    page.getByRole("heading", { name: "என் சேகரிப்பு" }),
  ).toBeVisible();

  await page.getByTestId("language-switcher").click();

  await expect(page).toHaveURL(/\/en\/collection$/);
  await expect(
    page.getByRole("heading", { name: "My collection" }),
  ).toBeVisible();

  const cookies = await context.cookies();
  const localeCookie = cookies.find((cookie) => cookie.name === "NEXT_LOCALE");
  expect(localeCookie?.value).toBe("en");
});
