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
  await sql`update extras set is_available = true`;
});

test("phones get the bottom menu bar; desktops don't", async ({ page }, info) => {
  await page.goto("/ar");
  const phone = info.project.name === "phone";
  await expect(page.getByTestId("bottom-nav")).toBeVisible({ visible: phone });
  if (!phone) return;
  await expect(page.getByTestId("bottom-nav").getByRole("link")).toHaveCount(3); // home, livestock, cart
  await expect(page.getByTestId("bottom-nav")).toContainText("قريباً"); // orders + account come later
});

test("phone home: short welcome, then Eid banner, then categories on the first screen", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "phone", "phone layout only");
  await page.goto("/ar");
  const eid = page.getByRole("link", { name: "عروض عيد الأضحى" });
  const categories = page.locator("#categories");
  const [eidBox, catBox] = [await eid.boundingBox(), await categories.boundingBox()];
  expect(eidBox!.y).toBeLessThan(catBox!.y);
  await expect(categories).toBeInViewport();
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
  await expect(builder.getByTestId("zoom-hint")).toContainText("🔍");
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

const EID_NOTE = "لا تشمل أضاحي عيد الأضحى الرأس والمصران والكرش حسب أنظمة وتعليمات المسالخ الحكومية.";

test("normal orders can add head, intestines and tripe", async ({ page }) => {
  await page.goto("/ar/sheep/naeemi");
  const builder = page.getByTestId("order-builder");
  await expect(page.locator("select[name=occasion]")).toHaveValue("none");
  for (const box of await builder.getByTestId("extra-choice").all()) await expect(box).toBeEnabled();
  await expect(builder.getByTestId("extras-note")).toHaveCount(0);
});

test("from the Eid banner: head, intestines and tripe are off with the Eid message", async ({ page }) => {
  await page.goto("/ar/seasonal/eid-al-adha");
  await page.getByTestId("breed-card").filter({ hasText: "نعيمي" }).click();
  await expect(page.locator("select[name=occasion]")).toHaveValue("udhiyah");
  const builder = page.getByTestId("order-builder");
  for (const box of await builder.getByTestId("extra-choice").all()) await expect(box).toBeDisabled();
  await expect(builder.getByTestId("extras-note")).toHaveText(EID_NOTE);
  await expect(page.locator("#step-cutting").locator("..")).not.toContainText("نفدت الكمية");

  // Changing the occasion to a normal order brings them back.
  await page.locator("select[name=occasion]").selectOption("aqiqah");
  for (const box of await builder.getByTestId("extra-choice").all()) await expect(box).toBeEnabled();
  await expect(builder.getByTestId("extras-note")).toHaveCount(0);
});

test("choosing Udhiyah by hand clears and locks the extras", async ({ page }) => {
  await page.goto("/ar/sheep/naeemi");
  const builder = page.getByTestId("order-builder");
  const first = builder.getByTestId("extra-choice").first();
  await first.check();
  await page.locator("select[name=occasion]").selectOption("udhiyah");
  await expect(first).not.toBeChecked();
  await expect(first).toBeDisabled();
  await expect(builder.getByTestId("extras-note")).toHaveText(EID_NOTE);
});

test("an extra switched off in the admin shows 'not available', never 'out of stock'", async ({ page }) => {
  await sql`update extras set is_available = false`;
  await page.goto("/ar/sheep/naeemi");
  const builder = page.getByTestId("order-builder");
  for (const box of await builder.getByTestId("extra-choice").all()) await expect(box).toBeDisabled();
  await expect(builder.getByTestId("extras-note")).toContainText("غير متاح حالياً");
  await expect(page.locator("#step-cutting").locator("..")).not.toContainText("نفدت الكمية");
  // ordering still works without them
  await builder.getByTestId("option-row").first().click();
  await builder.getByTestId("cutting-choice").first().click();
  await builder.getByTestId("packaging-choice").first().click();
  await builder.getByTestId("add-to-cart").click();
  await expect(builder.getByTestId("builder-message")).toContainText("تمت الإضافة");
  await sql`update extras set is_available = true`;
});

const SHEEP_RULE = "الأضحية أو العقيقة (غنم) يجب أن يكون عمرها 6 أشهر فأكثر.";

test("Udhiyah: sizes under 6 months (sheep) turn red and can't be added", async ({ page }) => {
  await page.goto("/ar/sheep/naeemi?occasion=udhiyah");
  const builder = page.getByTestId("order-builder");
  const rule = builder.getByTestId("age-rule");
  await expect(rule).toHaveText(SHEEP_RULE);
  await expect(rule).toHaveAttribute("data-error", "false");
  const rows = builder.getByTestId("option-row");
  await expect(rows.nth(0)).toHaveAttribute("data-too-young", "true"); // 2–4 months
  await expect(rows.nth(1)).toHaveAttribute("data-too-young", "true"); // 4–6 months
  await expect(rows.nth(2)).not.toHaveAttribute("data-too-young"); // 6–8 months

  await rows.nth(0).click();
  await expect(rule).toHaveAttribute("data-error", "true");
  await expect(page.locator("#step-size")).toHaveAttribute("data-missing", "false");
  await expect(builder.getByTestId("age-rule-occasion")).toHaveText(SHEEP_RULE);
  await builder.getByTestId("cutting-choice").first().click();
  await builder.getByTestId("packaging-choice").first().click();
  await builder.getByTestId("add-to-cart").click();
  // A popup explains and offers one-tap fixes; nothing is added.
  const dialog = page.getByTestId("age-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByTestId("age-dialog-message")).toHaveText(SHEEP_RULE);
  await expect(builder.getByTestId("builder-message")).toHaveCount(0);
  await dialog.getByTestId("age-dialog-close").click();
  await expect(dialog).toHaveCount(0);
  await expect(rows.nth(0)).toHaveAttribute("aria-checked", "true"); // closing changes nothing

  await builder.getByTestId("add-to-cart").click();
  await expect(dialog.getByTestId("age-dialog-pick")).toHaveText("اختيار كبير (6–8 أشهر) – 1,240 د.إ");
  await dialog.getByTestId("age-dialog-pick").click();
  await expect(dialog).toHaveCount(0);
  await expect(rows.nth(2)).toHaveAttribute("aria-checked", "true");
  await expect(rule).toHaveAttribute("data-error", "false");
  await expect(builder.getByTestId("age-rule-occasion")).toHaveCount(0);
  await builder.getByTestId("add-to-cart").click();
  await expect(builder.getByTestId("builder-message")).toContainText("تمت الإضافة");
});

test("age popup: 'not an Udhiyah or Aqiqah' keeps the size; no old-enough size offers another breed", async ({
  page,
}) => {
  await page.goto("/ar/sheep/naeemi");
  const builder = page.getByTestId("order-builder");
  await builder.getByTestId("option-row").first().click();
  await builder.getByTestId("cutting-choice").first().click();
  await builder.getByTestId("packaging-choice").first().click();
  await page.locator("select[name=occasion]").selectOption("aqiqah");
  await builder.getByTestId("add-to-cart").click();
  const dialog = page.getByTestId("age-dialog");
  await dialog.getByTestId("age-dialog-not-sacrifice").click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator("select[name=occasion]")).toHaveValue("none");
  await expect(builder.getByTestId("option-row").first()).toHaveAttribute("aria-checked", "true");
  await builder.getByTestId("add-to-cart").click();
  await expect(builder.getByTestId("builder-message")).toContainText("تمت الإضافة");

  // Local goats are all under 12 months: the popup offers another breed instead.
  await page.goto("/ar/goats/local?occasion=udhiyah");
  await builder.getByTestId("option-row").first().click();
  await builder.getByTestId("cutting-choice").first().click();
  await builder.getByTestId("packaging-choice").first().click();
  await builder.getByTestId("add-to-cart").click();
  await expect(dialog.getByTestId("age-dialog-pick")).toHaveCount(0);
  await dialog.getByTestId("age-dialog-other-breed").click();
  await expect(page).toHaveURL(/\/ar\/goats$/);
});

test("Aqiqah on goats needs 12+ months; normal orders have no age rule", async ({ page }) => {
  await page.goto("/en/goats/somali");
  const builder = page.getByTestId("order-builder");
  await expect(builder.getByTestId("age-rule")).toHaveCount(0);
  await page.goto("/en/goats/local");
  await expect(builder.getByTestId("age-rule")).toHaveCount(0);
  await expect(builder.locator("[data-too-young]")).toHaveCount(0);
  await builder.getByTestId("option-row").first().click();

  await page.locator("select[name=occasion]").selectOption("aqiqah");
  await expect(builder.getByTestId("age-rule")).toHaveText(
    "An Udhiyah or Aqiqah (Goats) must be 12 months or older.",
  );
  await expect(builder.getByTestId("age-rule")).toHaveAttribute("data-error", "true");
  await expect(builder.getByTestId("too-young-tag")).toHaveCount(3); // local goats are all under 12 months

  await page.goto("/en/goats/somali?occasion=udhiyah");
  await expect(builder.locator("[data-too-young]")).toHaveCount(0); // 12–15 months is fine
});

test("the server refuses a too-young Udhiyah even if the page is bypassed", async ({ page }) => {
  await page.goto("/ar/sheep/naeemi");
  const builder = page.getByTestId("order-builder");
  await builder.getByTestId("option-row").first().click();
  await builder.getByTestId("cutting-choice").first().click();
  await builder.getByTestId("packaging-choice").first().click();
  await builder.getByTestId("add-to-cart").click();
  await expect(builder.getByTestId("builder-message")).toContainText("تمت الإضافة");
  // turn the saved line into an Udhiyah behind the page's back
  const [{ id }] = await naeemiSmall;
  const [line] =
    await sql`select id from cart_items where breed_option_id = ${id} order by created_at desc limit 1`;
  await sql`update cart_items set occasion = 'udhiyah' where id = ${line.id}`;
  await page.goto("/ar/cart");
  await expect(page.locator("[data-problem=tooYoung]").first()).toContainText("أصغر من العمر المطلوب");
  await sql`delete from cart_items where id = ${line.id}`;
});

test("menu links to a section scroll there every time, even when pressed twice", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "desktop menu");
  await page.goto("/en");
  const faq = page.getByRole("banner").getByRole("link", { name: "FAQ" });
  await faq.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await faq.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
  await expect(page.locator("#faq")).toBeInViewport();
});

test("back-to-top arrow appears after scrolling and returns to the top", async ({ page }) => {
  await page.goto("/ar");
  const btn = page.getByTestId("back-to-top");
  await expect(btn).toHaveCSS("opacity", "0");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(btn).toHaveCSS("opacity", "1");
  await btn.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test("Eid page opens with a green banner and no photo", async ({ page }) => {
  await page.goto("/ar/seasonal/eid-al-adha");
  const hero = page.getByTestId("season-hero");
  await expect(hero).toHaveClass(/bg-green/);
  await expect(hero.locator("img")).toHaveCount(0);
  await expect(hero.getByRole("heading", { level: 1 })).toHaveText("أضحية عيد الأضحى / القربان");
});
