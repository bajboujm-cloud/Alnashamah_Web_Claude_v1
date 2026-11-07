import { expect, test } from "@playwright/test";
import { sql } from "./db";

const naeemiSmall = sql`select o.id from breed_options o join breeds b on b.id = o.breed_id
  join categories c on c.id = b.category_id where b.slug = 'naeemi' and c.slug = 'sheep' and o.sort_order = 1`;

test.afterAll(async () => {
  const [{ id }] = await naeemiSmall;
  await sql`update breed_options set compare_at_price_fils = null where id = ${id}`;
});

test("phones get the bottom menu bar and the category strip; desktops don't", async ({ page }, info) => {
  await page.goto("/ar");
  const phone = info.project.name === "phone";
  await expect(page.getByTestId("bottom-nav")).toBeVisible({ visible: phone });
  await expect(page.getByTestId("category-strip")).toBeVisible({ visible: phone });
  if (!phone) return;
  await expect(page.getByTestId("bottom-nav").getByRole("link")).toHaveCount(3); // home, livestock, cart
  await expect(page.getByTestId("bottom-nav")).toContainText("قريباً"); // orders + account come later
  await page.getByTestId("category-strip").getByRole("link", { name: /ماعز/ }).click();
  await expect(page).toHaveURL(/\/ar\/goats$/);
});

test("order builder shows Required tags and ticks the chosen cards", async ({ page }) => {
  await page.goto("/en/sheep/naeemi");
  const builder = page.getByTestId("order-builder");
  await expect(builder.getByTestId("required-tag")).toHaveCount(3); // size, cutting, packaging
  await expect(builder.getByTestId("tick")).toHaveCount(1); // packaging pre-selected
  await builder.getByTestId("option-row").first().click();
  await builder.getByTestId("cutting-choice").first().click();
  await expect(builder.getByTestId("tick")).toHaveCount(3);
});

test("cutting cards scroll sideways on phones without widening the page", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "phone layout only");
  await page.goto("/ar/sheep/naeemi");
  const list = page.getByTestId("cutting-list");
  const { scroll, client } = await list.evaluate((el) => ({
    scroll: el.scrollWidth,
    client: el.clientWidth,
  }));
  expect(scroll).toBeGreaterThan(client);
  // Several cards fit on the screen side by side.
  const first = await page.getByTestId("cutting-choice").first().boundingBox();
  expect(first!.width).toBeLessThan(client / 2);
  const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(pageWidth).toBeLessThanOrEqual(0);
});

test("a size with an old price shows a discount badge on the breed card", async ({ page }) => {
  const [{ id }] = await naeemiSmall;
  await sql`update breed_options set compare_at_price_fils = 127000 where id = ${id}`; // 1,270 → 1,143 = 10%
  await page.goto("/en/sheep");
  const card = page.getByTestId("breed-card").filter({ hasText: "Naeemi" });
  await expect(card.getByTestId("discount-badge")).toHaveText("10% off");
  await expect(card.getByTestId("card-old-price")).toHaveText("AED 1,270");
  await page.goto("/ar/sheep");
  await expect(
    page.getByTestId("breed-card").filter({ hasText: "نعيمي" }).getByTestId("discount-badge"),
  ).toHaveText("خصم 10%");
});

test("breed page has a share button", async ({ page }) => {
  await page.goto("/ar/goats/kashmiri");
  await expect(page.getByTestId("share-button")).toContainText("مشاركة");
});
