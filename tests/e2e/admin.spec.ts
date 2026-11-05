import { expect, test, type Page } from "@playwright/test";
import { currentTotp } from "../../src/server/auth/totp";
import { cleanupStaff, createStaff, PASSWORD, signIn } from "./admin-helpers";
import { setBreedAvailable, sql } from "./db";

test.describe.configure({ mode: "serial" });

const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

let page: Page;

test.beforeAll(async ({ browser }, info) => {
  await setBreedAvailable("sheep", "herri", true);
  const email = `owner-${info.project.name}@e2e.test`;
  const secret = await createStaff(email, "owner");
  page = await browser.newPage();
  page.on("dialog", (d) => d.accept());
  await signIn(page, "en", email, secret);
});

test.afterAll(async () => {
  await page?.close();
  await setBreedAvailable("sheep", "herri", true);
  await sql`update breed_options set price_fils = null, age_min_months = null, age_max_months = null,
    weight_min_kg = null, weight_max_kg = null
    where sort_order = 1 and breed_id = (select b.id from breeds b join categories c on c.id = b.category_id
      where b.slug = 'local' and c.slug = 'sheep')`;
  await sql`update breeds set photo_url = null where slug = 'local'
    and category_id = (select id from categories where slug = 'sheep')`;
  await cleanupStaff();
});

test("admin pages require signing in", async ({ browser }) => {
  const anon = await browser.newPage();
  await anon.goto("/en/admin/breeds");
  await expect(anon).toHaveURL(/\/en\/admin\/login$/);
  await anon.close();
});

test("wrong password is refused, and 5 failures lock the account", async ({ browser }, info) => {
  const email = `locked-${info.project.name}@e2e.test`;
  await createStaff(email, "manager");
  const p = await browser.newPage();
  for (let i = 0; i < 5; i++) {
    await p.goto("/en/admin/login");
    await p.fill("input[name=email]", email);
    await p.fill("input[name=password]", "wrong-password-1");
    await p.click("button[type=submit]");
    await expect(p.getByTestId("form-message")).toBeVisible();
  }
  await expect(p.getByTestId("form-message")).toContainText("Too many attempts");
  // Even the right password is refused while locked.
  await p.fill("input[name=password]", PASSWORD);
  await p.click("button[type=submit]");
  await expect(p.getByTestId("form-message")).toContainText("Too many attempts");
  await p.close();
});

test("first sign-in links an authenticator app with a QR code", async ({ browser }, info) => {
  const email = `new-${info.project.name}@e2e.test`;
  await createStaff(email, "order_staff", false);
  const p = await browser.newPage();
  await p.goto("/ar/admin/login");
  await p.fill("input[name=email]", email);
  await p.fill("input[name=password]", PASSWORD);
  await p.click("button[type=submit]");
  await expect(p.getByTestId("totp-qr")).toBeVisible();
  const key = (await p.getByTestId("totp-key").textContent())!.replace(/\s/g, "");
  await p.fill("input[name=code]", "000000" === currentTotp(key) ? "111111" : "000000");
  await p.click("button[type=submit]");
  await expect(p.getByTestId("form-message")).toBeVisible();
  await p.fill("input[name=code]", currentTotp(key));
  await p.click("button[type=submit]");
  await expect(p).toHaveURL(/\/ar\/admin$/);

  // Order staff: stock switches yes, categories / prices no.
  await expect(p.getByRole("link", { name: "الأقسام" })).toHaveCount(0);
  await p.goto("/ar/admin/categories");
  await expect(p).toHaveURL(/\/ar\/admin\?denied=1$/);
  await p.goto("/ar/admin/breeds");
  await expect(p.getByTestId("breed-switch").first()).toBeVisible();
  await expect(p.getByText("تعديل")).toHaveCount(0);
  await p.close();
});

test("one-tap switch puts a breed out of stock on the website", async () => {
  await page.goto("/en/admin/breeds");
  const herri = page.locator('[data-testid=admin-breed][data-slug="sheep/herri"]');
  const sw = herri.getByTestId("breed-switch");
  await expect(sw).toHaveAttribute("aria-checked", "true");
  await sw.click();
  await expect(sw).toHaveAttribute("aria-checked", "false");
  await expect(sw).not.toHaveAttribute("data-pending");
  await page.goto("/en/sheep");
  await expect(page.getByTestId("breed-card").filter({ hasText: "Herri" })).toContainText("Out of stock");
  await page.goto("/en/admin/breeds");
  await herri.getByTestId("breed-switch").click();
  await expect(herri.getByTestId("breed-switch")).toHaveAttribute("aria-checked", "true");
});

test("editing a size and uploading a photo updates the website", async () => {
  await page.goto("/en/admin/breeds");
  await page
    .locator('[data-testid=admin-breed][data-slug="sheep/local"]')
    .getByRole("link", { name: "Edit" })
    .click();
  const size = page.getByTestId("size-form").first();
  await size.locator("input[name=ageMinMonths]").fill("3");
  await size.locator("input[name=ageMaxMonths]").fill("5");
  await size.locator("input[name=weightMinKg]").fill("9");
  await size.locator("input[name=weightMaxKg]").fill("11");
  await size.locator("input[name=priceAed]").fill("950");
  await size.getByRole("button", { name: "Save" }).click();
  await expect(size.getByTestId("form-message")).toHaveText("Saved ✓");

  // Age bigger than "to" is refused.
  await size.locator("input[name=ageMinMonths]").fill("9");
  await size.getByRole("button", { name: "Save" }).click();
  await expect(size.getByTestId("form-message")).toContainText("check the highlighted");
  await size.locator("input[name=ageMinMonths]").fill("3");

  await page.setInputFiles("input[name=photo]", {
    name: "local.png",
    mimeType: "image/png",
    buffer: PNG_1PX,
  });
  const details = page.locator("form").filter({ has: page.locator("input[name=nameEn]") });
  await details.getByRole("button", { name: "Save" }).click();
  await expect(details.getByTestId("form-message")).toHaveText("Saved ✓");

  await page.goto("/en/sheep/local");
  const first = page.getByTestId("option-row").first();
  await expect(first).toContainText("3–5 months");
  await expect(first).toContainText("9–11 kg");
  await expect(first).toContainText("AED 950");
  await expect(page.locator('main img[alt="Local"]').first()).toHaveAttribute(
    "src",
    /files%2Fbreeds|\/files\/breeds/,
  );
});

test("a fake image file is refused", async () => {
  await page.goto("/en/admin/breeds");
  await page
    .locator('[data-testid=admin-breed][data-slug="sheep/najdi"]')
    .getByRole("link", { name: "Edit" })
    .click();
  await page.setInputFiles("input[name=photo]", {
    name: "evil.png",
    mimeType: "image/png",
    buffer: Buffer.from("<script>alert(1)</script>"),
  });
  const details = page.locator("form").filter({ has: page.locator("input[name=nameEn]") });
  await details.getByRole("button", { name: "Save" }).click();
  await expect(details.getByTestId("form-message")).toContainText("JPG, PNG or WebP");
});

test("owner adds a staff member and gets a one-time password", async ({}, info) => {
  await page.goto("/en/admin/staff");
  const form = page.locator("section").filter({ hasText: "Add staff member" });
  await form.locator("input[name=name]").fill("New Editor");
  await form.locator("input[name=email]").fill(`editor-${info.project.name}@e2e.test`);
  await form.locator("select[name=role]").selectOption("content_editor");
  await form.getByRole("button", { name: "Add" }).click();
  await expect(form.getByTestId("form-extra")).toHaveText(/^[A-Za-z0-9]{7}-[A-Za-z0-9]{7}$/);
  await expect(page.getByTestId("staff-row").filter({ hasText: "New Editor" })).toBeVisible();
});

test("every change is in the activity log", async () => {
  await page.goto("/en/admin/audit");
  await expect(page.getByText("breed · out-of-stock").first()).toBeVisible();
  await expect(page.getByText("size · update").first()).toBeVisible();
});
