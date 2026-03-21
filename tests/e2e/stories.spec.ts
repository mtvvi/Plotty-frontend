import { expect, test } from "@playwright/test";

test("catalog filters by tag and opens story page", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Каталог историй и глав" })).toBeVisible();
  await page.getByRole("button", { name: "slow burn" }).click();

  await expect(page).toHaveURL(/tag=slow-burn/);
  await page.getByRole("link", { name: "После полуночи снег не тает" }).click();
  await expect(page).toHaveURL(/stories\/after-midnight-the-snow-does-not-melt/);
});

test("create story, add next chapter, run spellcheck and generate image", async ({ page }) => {
  await page.goto("/write");

  await page.getByLabel("Название истории").fill("Midnight Draft");
  await page.getByLabel("Короткий тизер").fill("Тизер истории");
  await page.getByLabel("Полное описание").fill("Полное описание истории");
  await page.getByRole("button", { name: "slow burn" }).click();
  await page.getByLabel("Название главы").fill("Глава 1");
  await page.getByLabel("Текст главы").fill("Это текст главы, где автор нечаяно ошибся.");
  await page.getByRole("button", { name: "Создать историю и главу" }).click();

  await expect(page).toHaveURL(/\/write\/stories\/.+\/chapters\/.+/);

  await page.getByRole("button", { name: "Проверить орфографию" }).click();
  await expect(page.getByText(/нечаянно/i)).toBeVisible();

  await page.getByLabel("Промпт для картинки").fill("Ледяной архив ночью");
  await page.getByRole("button", { name: "Сгенерировать картинку" }).click();
  await expect(page.getByRole("img", { name: "Ледяной архив ночью" })).toBeVisible();

  await page.getByRole("button", { name: "Новая глава" }).click();
  await expect(page.getByDisplayValue("Глава 2")).toBeVisible();

  await page.goto("/stories/midnight-draft/chapters/1");
  await expect(page.getByRole("img", { name: "Глава 1" })).toBeVisible();
});
