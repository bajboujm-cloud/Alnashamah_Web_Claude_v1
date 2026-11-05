import { expect, test } from "@playwright/test";
import { setBreedAvailable, setOptionAvailable, sql } from "./db";

test.afterAll(async () => {
  await setBreedAvailable("sheep", "herri", true);
  await setOptionAvailable("sheep", "naeemi", 2, true);
  await sql.end();
});

test("root sends Arabic browsers to /ar and English browsers to /en", async ({ browser }) => {
  const ar = await browser.newContext({ locale: "ar-AE" });
  const arPage = await ar.newPage();
  await arPage.goto("/");
  await expect(arPage).toHaveURL(/\/ar$/);
  await ar.close();

  const en = await browser.newContext({ locale: "en-US" });
  const enPage = await en.newPage();
  await enPage.goto("/");
  await expect(enPage).toHaveURL(/\/en$/);
  await en.close();
});

test("Arabic home is right-to-left with all four categories", async ({ page }) => {
  await page.goto("/ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.getByTestId("category-card")).toHaveCount(4);
  await expect(page.getByTestId("category-card").filter({ hasText: "أبقار" })).toContainText("قريباً");
  await expect(page.getByTestId("category-card").filter({ hasText: "إبل" })).toContainText("قريباً");
  await expect(page.getByText("أضحية عيد الأضحى / القربان").first()).toBeVisible();
});

test("English home is left-to-right", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Heritage of the local market");
});

test("sheep has 5 breeds and goats has 3", async ({ page }) => {
  await page.goto("/en/sheep");
  await expect(page.getByTestId("breed-card")).toHaveCount(5);
  for (const name of ["Naeemi", "Najdi", "Herri", "Somali", "Local"]) {
    await expect(page.getByTestId("breed-card").filter({ hasText: name })).toHaveCount(1);
  }
  await page.goto("/en/goats");
  await expect(page.getByTestId("breed-card")).toHaveCount(3);
  await expect(page.getByTestId("breed-card").filter({ hasText: "Kashmiri" })).toHaveCount(1);
});

test("breed page shows 3 age/weight options and packaging prices", async ({ page }) => {
  await page.goto("/en/sheep/naeemi");
  await expect(page.getByTestId("option-row")).toHaveCount(3);
  await expect(page.getByText("Slaughterhouse bag")).toBeVisible();
  await expect(page.getByText("AED 10", { exact: true })).toBeVisible();
  await expect(page.getByText("AED 25", { exact: true })).toBeVisible();
});

test("switched-off breed stays visible with an Out of stock label", async ({ page }) => {
  await setBreedAvailable("sheep", "herri", false);
  await page.goto("/en/sheep");
  const herri = page.getByTestId("breed-card").filter({ hasText: "Herri" });
  await expect(herri).toBeVisible();
  await expect(herri).toContainText("Out of stock");
  await page.goto("/ar/sheep/herri");
  await expect(page.getByText("نفدت الكمية").first()).toBeVisible();
  await expect(page.locator('[data-testid="option-row"][data-available="false"]')).toHaveCount(3);
});

test("switched-off age/weight option stays visible with an Out of stock label", async ({ page }) => {
  await setOptionAvailable("sheep", "naeemi", 2, false);
  await page.goto("/en/sheep/naeemi");
  const rows = page.getByTestId("option-row");
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(1)).toHaveAttribute("data-available", "false");
  await expect(rows.nth(1)).toContainText("Out of stock");
  await expect(rows.nth(0)).toHaveAttribute("data-available", "true");
});

test("language switch keeps the same page", async ({ page }) => {
  await page.goto("/ar/goats/kashmiri");
  await page.getByTestId("language-switch").click();
  await expect(page).toHaveURL(/\/en\/goats\/kashmiri$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
});

test("coming-soon category and Eid page", async ({ page }) => {
  await page.goto("/en/camels");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Camels");
  await expect(page.getByText("Coming soon").first()).toBeVisible();
  await page.goto("/en/seasonal/eid-al-adha");
  await expect(page.getByTestId("breed-card")).toHaveCount(8);
});

test("unknown pages return 404", async ({ page }) => {
  const res = await page.goto("/en/sheep/unicorn");
  expect(res?.status()).toBe(404);
  await expect(page.getByText("Page not found")).toBeVisible();
});

test("sample prices show on cards and the breed page", async ({ page }) => {
  await page.goto("/en/sheep");
  await expect(page.getByTestId("breed-card").filter({ hasText: "Naeemi" })).toContainText("AED 1,143");
  await expect(page.getByTestId("breed-card").filter({ hasText: "Herri" })).toContainText(
    "Price coming soon",
  );
  await page.goto("/en/sheep/naeemi");
  const rows = page.getByTestId("option-row");
  await expect(rows.nth(0)).toContainText("2–4 months");
  await expect(rows.nth(0)).toContainText("8–10 kg");
  await expect(rows.nth(2)).toContainText("AED 1,240");
});

test("cards sit two per row on phones", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "phone", "phone layout only");
  await page.goto("/ar/sheep");
  const [a, b] = [page.getByTestId("breed-card").nth(0), page.getByTestId("breed-card").nth(1)];
  const [boxA, boxB] = [await a.boundingBox(), await b.boundingBox()];
  expect(boxA && boxB && Math.abs(boxA.y - boxB.y) < 2).toBeTruthy();
});
