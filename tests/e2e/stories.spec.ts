import { expect, test } from "@playwright/test";

test("catalog filters by tag and opens story page", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Каталог историй и глав" })).toBeVisible();
  await page.getByRole("button", { name: "драма" }).click();

  await expect(page).toHaveURL(/tag=drama/);
  await page.getByRole("link", { name: "После полуночи снег не тает" }).click();
  await expect(page).toHaveURL(/stories\/after-midnight-the-snow-does-not-melt/);
});

test("create story from author workspace, add next chapter and run spellcheck", async ({ page }) => {
  await page.goto("/write");

  await page.getByRole("button", { name: "Создать свою историю" }).click();
  await page.getByLabel("Название истории").fill("Midnight Draft");
  await page.getByLabel("Короткий тизер").fill("Тизер истории");
  await page.getByLabel("Полное описание").fill("Полное описание истории");
  await page.getByRole("button", { name: "драма" }).click();
  await page.getByLabel("Название главы").fill("Глава 1");
  await page.getByLabel("Текст главы").fill("Это текст главы, где автор нечаяно ошибся.");
  await page.getByRole("button", { name: "Создать историю и главу" }).click();

  await expect(page).toHaveURL(/\/write\/stories\/.+\/chapters\/.+/);

  await page.getByRole("button", { name: "Проверить орфографию" }).click();
  await expect(page.getByText(/нечаянно/i)).toBeVisible();

  await page.getByRole("button", { name: "Новая глава" }).click();
  await expect(page.getByDisplayValue("Глава 2")).toBeVisible();
});
