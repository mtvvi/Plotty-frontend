import { expect, test } from "@playwright/test";

test("catalog filters by tag and opens story page", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Каталог историй и глав" })).toBeVisible();
  await page.getByRole("button", { name: "драма" }).click();

  await expect(page).toHaveURL(/tag=drama/);
  await page.getByRole("link", { name: "Перейти на страницу истории После полуночи снег не тает" }).click();
  await expect(page).toHaveURL(/stories\/after-midnight-the-snow-does-not-melt/);
});

test("authenticated catalog load does not fetch chapter cover details", async ({ browser }) => {
  const context = await browser.newContext();
  await context.addInitScript(() => window.localStorage.setItem("plotty:mock-auth-user-id", "1"));
  const page = await context.newPage();
  const fetchPaths: string[] = [];

  page.on("request", (request) => {
    if (request.resourceType() !== "fetch") {
      return;
    }

    const url = new URL(request.url());
    fetchPaths.push(url.pathname + url.search);
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Каталог историй и глав" })).toBeVisible();
  await page.waitForLoadState("networkidle");

  expect(fetchPaths.filter((path) => /^\/api\/chapters\/[^/]+$/.test(path))).toHaveLength(0);

  await context.close();
});

test("create story from author workspace, add next chapter and run spellcheck", async ({ page }) => {
  test.setTimeout(60_000);
  await page.addInitScript(() => window.localStorage.setItem("plotty:mock-auth-user-id", "1"));
  await page.goto("/write/new");

  await page.getByLabel("Название истории").fill("Midnight Draft");
  await page.getByRole("button", { name: /^Далее$/i }).click();
  await page.getByRole("button", { name: "DC" }).click();
  await page.getByRole("button", { name: "NC-17" }).click();
  await page.getByRole("button", { name: "В процессе" }).click();
  await page.getByRole("button", { name: "Макси" }).click();
  await page.getByRole("button", { name: "Драма" }).click();
  await page.getByRole("button", { name: /^Далее$/i }).click();
  await page.getByRole("button", { name: "Сохранить историю" }).click();
  await page.getByLabel("Название главы").fill("Глава 1");
  await page.getByLabel("Текст главы").fill("Это текст главы, где автор нечаяно ошибся.");
  await page.getByRole("button", { name: "Создать главу и открыть редактор" }).click();

  await expect(page).toHaveURL(/\/write\/stories\/.+\/chapters\/.+/, { timeout: 15_000 });

  await page.getByRole("button", { name: "Проверить орфографию" }).click();
  await expect(page.getByText(/нечаянно/i)).toBeVisible();

  await page.getByRole("button", { name: "Новая глава" }).click();
  await expect(page.getByLabel("Название главы")).toHaveValue("Глава 2");
});
