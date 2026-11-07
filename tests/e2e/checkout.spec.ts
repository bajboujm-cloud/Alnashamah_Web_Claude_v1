import { expect, test, type Page } from "@playwright/test";
import { sql } from "./db";

/** A fresh UAE mobile for each test, so per-number limits never collide. */
const newPhone = () => `05${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`;

async function addSheep(page: Page) {
  await page.goto("/ar/sheep/naeemi");
  const b = page.getByTestId("order-builder");
  await b.getByTestId("option-row").first().click();
  await b.getByTestId("cutting-choice").first().click();
  await b.getByTestId("packaging-choice").first().click();
  await b.getByTestId("add-to-cart").click();
  await expect(b.getByTestId("builder-message")).toContainText("تمت الإضافة");
}

/** Phone → code (read from the laptop-only test box) → confirmed. */
async function verifyPhone(page: Page, phone: string) {
  const box = page.getByTestId("phone-sign-in");
  await box.locator("input[name=phone]").fill(phone);
  await box.getByTestId("send-code").click();
  const dev = box.getByTestId("dev-code");
  await expect(dev).toBeVisible();
  const code = (await dev.innerText()).match(/\d{6}/)![0];
  await box.getByTestId("code-input").fill(code);
  await box.getByTestId("confirm-code").click();
}

test.afterAll(async () => {
  await sql`update settings set value = 'false'::jsonb where key = 'delivery.pickup_enabled'`;
  await sql`update delivery_zones set fee_fils = null`;
  await sql`delete from delivery_blackout_dates`;
});

test("an empty cart can't go to checkout", async ({ page }) => {
  await page.goto("/ar/checkout");
  await expect(page).toHaveURL(/\/ar\/cart$/);
});

test("guest checkout: verify the mobile, add the address, review with 'delivery fee to be confirmed'", async ({
  page,
}) => {
  await addSheep(page);
  await page.goto("/ar/cart");
  await page.getByTestId("go-checkout").click();
  await expect(page).toHaveURL(/\/ar\/checkout$/);

  await page.getByTestId("mode-guest").click();
  await verifyPhone(page, newPhone());
  await expect(page.getByTestId("signed-in-as")).toContainText("ضيف");

  const form = page.getByTestId("checkout-form");
  await expect(form.locator("input[name=saveAddress]")).toHaveCount(0); // guests have no address book
  await form.getByTestId("save-checkout").click();
  await expect(page.getByTestId("checkout-error")).toBeVisible(); // name and address missing
  await expect(form.locator("[data-field=name][data-bad]")).toBeVisible();

  await form.locator("input[name=name]").fill("محمد أحمد");
  await form.locator("select[name=zoneId]").selectOption({ label: "دبي" });
  await form.locator("input[name=area]").fill("البرشاء");
  await form.locator("input[name=street]").fill("شارع 12، فيلا 4");
  await form.getByTestId("save-checkout").click();

  const review = page.getByTestId("review");
  await expect(review).toBeVisible();
  await expect(review.getByTestId("review-address")).toContainText("دبي — البرشاء");
  await expect(page.getByTestId("summary-delivery")).toHaveText("سيتم تأكيدها");
  await expect(page.getByTestId("fee-note")).toBeVisible();
  await expect(page.getByTestId("checkout-total")).toHaveText("1,143 د.إ");
  await expect(review.getByTestId("pay")).toBeDisabled();
});

test("wrong codes: a clear message, then locked after 5 tries; other countries are refused", async ({
  page,
}) => {
  await page.goto("/en/account/login");
  const box = page.getByTestId("phone-sign-in");
  await box.locator("input[name=phone]").fill("+44 7700 900123");
  await box.getByTestId("send-code").click();
  await expect(box.getByTestId("sign-in-error")).toContainText("valid mobile number");

  await box.locator("input[name=phone]").fill(newPhone());
  await box.getByTestId("send-code").click();
  await expect(box.getByTestId("dev-code")).toBeVisible();
  const real = (await box.getByTestId("dev-code").innerText()).match(/\d{6}/)![0];
  const wrong = real === "000000" ? "111111" : "000000";
  for (let i = 4; i >= 1; i--) {
    await box.getByTestId("code-input").fill(wrong);
    await box.getByTestId("confirm-code").click();
    await expect(box.getByTestId("sign-in-error")).toHaveText(`Wrong code. ${i} tries left.`);
  }
  await box.getByTestId("code-input").fill(wrong);
  await box.getByTestId("confirm-code").click();
  await expect(box.getByTestId("sign-in-error")).toContainText("Too many wrong codes");
  // even the right code no longer works
  await box.getByTestId("code-input").fill(real);
  await box.getByTestId("confirm-code").click();
  await expect(box.getByTestId("sign-in-error")).toContainText("Too many wrong codes");
  await expect(page).toHaveURL(/\/en\/account\/login$/);
});

test("members: sign in, save an address at checkout, find it in the account, sign out", async ({ page }) => {
  const phone = newPhone();
  await page.goto("/en/account");
  await expect(page).toHaveURL(/\/en\/account\/login$/);
  await verifyPhone(page, phone);
  await expect(page).toHaveURL(/\/en\/account$/);
  await expect(page.getByTestId("account-addresses")).toContainText("No saved addresses yet");

  await addSheep(page);
  await page.goto("/en/checkout");
  await expect(page.getByTestId("signed-in-as")).toContainText("Signed in");
  const form = page.getByTestId("checkout-form");
  await form.locator("input[name=name]").fill("Sara Ali");
  await form.locator("input[name=email]").fill("sara@example.com");
  await form.locator("select[name=zoneId]").selectOption({ label: "Abu Dhabi" });
  await form.locator("input[name=area]").fill("Khalifa City");
  await form.locator("input[name=street]").fill("Street 5, Villa 10");
  await expect(form.locator("input[name=saveAddress]")).toBeChecked();
  await form.getByTestId("save-checkout").click();
  await expect(page.getByTestId("review")).toContainText("Abu Dhabi — Khalifa City");

  // Next time the saved address is offered first.
  await page.reload();
  await expect(form.getByTestId("address-choice").first()).toContainText("Khalifa City");
  await expect(form.getByTestId("address-choice").first().locator("input")).toBeChecked();

  await page.goto("/en/account");
  await expect(page.getByTestId("saved-address")).toHaveCount(1);
  await expect(page.locator("input[name=name]")).toHaveValue("Sara Ali");
  await page.getByTestId("saved-address").getByRole("button", { name: "Delete" }).click();
  await expect(page.getByTestId("saved-address")).toHaveCount(0);

  await page.getByTestId("sign-out").click();
  await expect(page).toHaveURL(/\/en$/);
  await page.goto("/en/account");
  await expect(page).toHaveURL(/\/en\/account\/login$/);
});

test("pick-up from the shop, blackout days and past dates", async ({ page }) => {
  await sql`update settings set value = 'true'::jsonb where key = 'delivery.pickup_enabled'`;
  await sql`update settings set value = '"Al Aweer Livestock Market, Shop 12"'::jsonb where key = 'delivery.pickup_address_en'`;
  await addSheep(page);
  await page.goto("/en/checkout");
  await page.getByTestId("mode-guest").click();
  await verifyPhone(page, newPhone());
  const form = page.getByTestId("checkout-form");
  await form.locator("input[name=name]").fill("Omar");
  await form.locator("input[name=fulfilment][value=pickup]").check();
  await expect(form.getByTestId("pickup-address")).toContainText("Al Aweer Livestock Market");

  await form.locator("input[name=date]").fill("2020-01-01");
  await form.getByTestId("save-checkout").click();
  await expect(page.getByTestId("checkout-error")).toContainText("not available");

  const [{ d }] = await sql`select to_char((now() at time zone 'Asia/Dubai')::date + 3, 'YYYY-MM-DD') as d`;
  await sql`insert into delivery_blackout_dates (date) values (${d}) on conflict do nothing`;
  await page.reload();
  await form.locator("input[name=name]").fill("Omar");
  await form.locator("input[name=fulfilment][value=pickup]").check();
  await form.locator("input[name=date]").fill(d);
  await form.getByTestId("save-checkout").click();
  await expect(page.getByTestId("checkout-error")).toContainText("not available");

  const [{ ok }] = await sql`select to_char((now() at time zone 'Asia/Dubai')::date + 4, 'YYYY-MM-DD') as ok`;
  await form.locator("input[name=date]").fill(ok);
  await form.getByTestId("save-checkout").click();
  await expect(page.getByTestId("review")).toContainText("Al Aweer Livestock Market");
  await expect(page.getByTestId("summary-delivery")).toHaveText("Free (pick-up)");
  await expect(page.getByTestId("fee-note")).toHaveCount(0);
});

test("a delivery fee set for the emirate is added to the total", async ({ page }) => {
  await sql`update delivery_zones set fee_fils = 3000 where slug = 'sharjah'`;
  await addSheep(page);
  await page.goto("/en/checkout");
  await page.getByTestId("mode-guest").click();
  await verifyPhone(page, newPhone());
  const form = page.getByTestId("checkout-form");
  await form.locator("input[name=name]").fill("Khalid");
  await form.locator("select[name=zoneId]").selectOption({ label: "Sharjah" });
  await form.locator("input[name=area]").fill("Al Nahda");
  await form.locator("input[name=street]").fill("Tower 3, Flat 1201");
  await form.getByTestId("save-checkout").click();
  await expect(page.getByTestId("review")).toBeVisible();
  await expect(page.getByTestId("summary-delivery")).toHaveText("AED 30");
  await expect(page.getByTestId("checkout-total")).toHaveText("AED 1,173");
  await expect(page.getByTestId("fee-note")).toHaveCount(0);
});

test("checkout fits the phone screen (nothing cut off at the sides)", async ({ page }, info) => {
  test.skip(info.project.name !== "phone", "phone layout only");
  await addSheep(page);
  await page.goto("/ar/checkout");
  await page.getByTestId("mode-guest").click();
  await verifyPhone(page, newPhone());
  await expect(page.getByTestId("checkout-form")).toBeVisible();
  const overflow = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    return [...document.querySelectorAll("main *")].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && (r.left < -1 || r.right > width + 1);
    }).length;
  });
  expect(overflow).toBe(0);
});
