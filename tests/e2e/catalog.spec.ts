import { expect, test } from "@playwright/test";

test("catalog page loads and filters by fandom", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Каталог историй для чтения и публикации" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "После полуночи снег не тает" })).toBeVisible();

  await page.getByRole("button", { name: "Harry Potter" }).click();

  await expect(page).toHaveURL(/fandom=Harry\+Potter/);
  await expect(page.getByRole("heading", { name: "После полуночи снег не тает" })).toBeVisible();
});
