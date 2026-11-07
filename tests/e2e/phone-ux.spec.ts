import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { sql } from "./db";

const naeemiSmall = sql`select o.id from breed_options o join breeds b on b.id = o.breed_id
  join categories c on c.id = b.category_id where b.slug = 'naeemi' and c.slug = 'sheep' and o.sort_order = 1`;

test.afterAll(async () => {
  const [{ id }] = await naeemiSmall;
  await sql`update breed_options set compare_at_price_fils = null where id = ${id}`;
  await sql`update cutting_options set photo_url = null where slug = 'arabic-8'`;
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
  await expect(builder.getByTestId("tick")).toHaveCount(0); // nothing pre-selected
  await builder.getByTestId("option-row").first().click();
  await builder.getByTestId("cutting-choice").first().click();
  await expect(builder.getByTestId("tick")).toHaveCount(2);
});

test("cutting choices are boxes, two per row on phones, without widening the page", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "phone", "phone layout only");
  await page.goto("/ar/sheep/naeemi");
  const [a, b] = [page.getByTestId("cutting-choice").nth(0), page.getByTestId("cutting-choice").nth(1)];
  const [boxA, boxB] = [await a.boundingBox(), await b.boundingBox()];
  expect(Math.abs(boxA!.y - boxB!.y)).toBeLessThan(2);
  const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(pageWidth).toBeLessThanOrEqual(0);
});

test("breed page shows the name, then straight into the order (no photo or description)", async ({
  page,
}) => {
  await page.goto("/en/sheep/naeemi");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Naeemi");
  // The only pictures are the small round ones in the breed switcher.
  const allImages = await page.locator("main img").count();
  const switcherImages = await page.getByTestId("switcher").locator("img").count();
  expect(allImages).toBe(switcherImages);
  await expect(page.getByText("The Gulf's favourite breed")).toHaveCount(0);
  await expect(page.getByTestId("order-builder")).toBeVisible();
});

test("Livestock button opens the page with all categories", async ({ page }, info) => {
  await page.goto("/en/sheep/naeemi");
  if (info.project.name === "phone")
    await page.getByTestId("bottom-nav").getByRole("link", { name: "Livestock" }).click();
  else await page.locator("header nav").getByRole("link", { name: "Livestock" }).click();
  await expect(page).toHaveURL(/\/en\/livestock$/);
  await expect(page.getByTestId("category-card")).toHaveCount(4);
});

test("adding without a cutting choice points to the cutting step", async ({ page }) => {
  await page.goto("/en/sheep/naeemi");
  const builder = page.getByTestId("order-builder");
  await builder.getByTestId("option-row").first().click();
  await builder.getByTestId("add-to-cart").click();
  await expect(builder.getByTestId("builder-message")).toHaveText("Please choose how to cut it.");
  await expect(page.locator("#step-cutting")).toHaveAttribute("data-missing", "true");
  await expect(page.locator("#step-cutting")).toBeInViewport();
  await builder.getByTestId("cutting-choice").first().click();
  await expect(page.locator("#step-cutting")).toHaveAttribute("data-missing", "false");
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

test("breed switcher jumps between breeds of the same category", async ({ page }) => {
  await page.goto("/en/sheep/naeemi");
  const items = page.getByTestId("switcher").getByTestId("switcher-item");
  await expect(items).toHaveCount(5);
  await expect(items.filter({ hasText: "Naeemi" })).toHaveAttribute("aria-current", "page");
  await items.filter({ hasText: "Najdi" }).click();
  await expect(page).toHaveURL(/\/en\/sheep\/najdi$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Najdi");
});

test("category switcher jumps between categories", async ({ page }) => {
  await page.goto("/ar/sheep");
  const items = page.getByTestId("switcher").getByTestId("switcher-item");
  await expect(items).toHaveCount(4);
  await expect(items.filter({ hasText: "غنم" })).toHaveAttribute("aria-current", "page");
  await items.filter({ hasText: "ماعز" }).click();
  await expect(page).toHaveURL(/\/ar\/goats$/);
  await expect(page.getByTestId("breed-card")).toHaveCount(3);
});

test("nothing in 'Order includes' or packaging is pre-selected; packaging must be chosen", async ({
  page,
}) => {
  await page.goto("/en/sheep/naeemi");
  const builder = page.getByTestId("order-builder");
  for (const box of await builder.getByTestId("extra-choice").all()) await expect(box).not.toBeChecked();
  for (const p of await builder.getByTestId("packaging-choice").all())
    await expect(p).toHaveAttribute("aria-checked", "false");
  await builder.getByTestId("option-row").first().click();
  await builder.getByTestId("cutting-choice").first().click();
  await builder.getByTestId("add-to-cart").click();
  await expect(builder.getByTestId("builder-message")).toHaveText("Please choose the packaging.");
  await expect(page.locator("#step-packaging")).toHaveAttribute("data-missing", "true");
});

test("customers can optionally open a cutting photo and choose from it", async ({ page }) => {
  // a small real image in local storage, linked to the first cutting option
  const key = "cutting/00000000-aaaa-bbbb-cccc-000000000001.png";
  const dir = path.join(process.env.STORAGE_DIR ?? ".storage", "cutting");
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    path.join(dir, "00000000-aaaa-bbbb-cccc-000000000001.png"),
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
      "base64",
    ),
  );
  await sql`update cutting_options set photo_url = ${"/files/" + key} where slug = 'arabic-8'`;

  await page.goto("/en/sheep/naeemi");
  const builder = page.getByTestId("order-builder");
  await expect(builder.getByTestId("cutting-zoom")).toHaveCount(1);
  await builder.getByTestId("cutting-zoom").click();
  const dialog = page.getByTestId("cutting-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Arabic cut – 8 pieces");
  await dialog.getByTestId("cutting-dialog-choose").click();
  await expect(dialog).toHaveCount(0);
  await expect(builder.getByTestId("cutting-choice").first()).toHaveAttribute("aria-checked", "true");

  // Viewing is optional: tapping the card selects it directly.
  await builder.getByTestId("cutting-choice").nth(1).click();
  await expect(builder.getByTestId("cutting-choice").nth(1)).toHaveAttribute("aria-checked", "true");
  await expect(page.getByTestId("cutting-dialog")).toHaveCount(0);
});
