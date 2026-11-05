import { expect, test, type Page } from "@playwright/test";
import { setOptionAvailable, sql } from "./db";

test.afterAll(async () => {
  await setOptionAvailable("sheep", "naeemi", 1, true);
  await sql`delete from carts`;
});

async function buildNaeemi(page: Page, quantity = 1) {
  await page.goto("/en/sheep/naeemi");
  const builder = page.getByTestId("order-builder");
  await builder.getByTestId("option-row").first().click(); // Small · AED 1,143
  await builder.getByTestId("cutting-choice").first().click();
  await builder.getByTestId("packaging-choice").filter({ hasText: "Foam box with ice" }).click(); // + AED 25
  for (let i = 1; i < quantity; i++) await builder.getByRole("button", { name: "+", exact: true }).click();
  return builder;
}

test("build an order, add it to the cart and see the right totals", async ({ page }) => {
  const builder = await buildNaeemi(page, 2);
  await expect(builder.getByTestId("builder-total")).toHaveText("AED 2,336");
  await builder.getByTestId("add-to-cart").click();
  await expect(builder.getByTestId("builder-message")).toContainText("Added to your cart");
  await expect(page.getByTestId("cart-count")).toHaveText("2");

  await page.getByRole("link", { name: "View cart" }).click();
  await expect(page).toHaveURL(/\/en\/cart$/);
  const line = page.getByTestId("cart-line");
  await expect(line).toHaveCount(1);
  await expect(line).toContainText("Naeemi");
  await expect(line).toContainText("Foam box with ice");
  await expect(line).toContainText("Head");
  await expect(page.getByTestId("cart-total")).toHaveText("AED 2,336");
  await expect(page.getByText("VAT (5%)")).toBeVisible();

  // Change quantity, then remove.
  await page.getByRole("button", { name: "Decrease quantity" }).click();
  await expect(page.getByTestId("cart-total")).toHaveText("AED 1,168");
  await page.getByTestId("cart-remove").click();
  await expect(page.getByText("Your cart is empty.")).toBeVisible();
});

test("the server asks for missing choices", async ({ page }) => {
  await page.goto("/en/sheep/naeemi");
  const builder = page.getByTestId("order-builder");
  await builder.getByTestId("add-to-cart").click();
  await expect(builder.getByTestId("builder-message")).toHaveText("Choose a size first.");
  await builder.getByTestId("option-row").first().click();
  await builder.getByTestId("add-to-cart").click();
  await expect(builder.getByTestId("builder-message")).toHaveText("Please choose how to cut it.");
});

test("sizes without a price or out of stock can't be chosen", async ({ page }) => {
  await page.goto("/en/sheep/herri");
  await expect(page.getByTestId("option-row").first()).toBeDisabled();
  await setOptionAvailable("sheep", "naeemi", 2, false);
  await page.goto("/en/sheep/naeemi");
  await expect(page.getByTestId("option-row").nth(1)).toBeDisabled();
  await setOptionAvailable("sheep", "naeemi", 2, true);
});

test("an item that goes out of stock is flagged in the cart and left out of the total", async ({ page }) => {
  const builder = await buildNaeemi(page);
  await builder.getByTestId("add-to-cart").click();
  await expect(builder.getByTestId("builder-message")).toContainText("Added to your cart");
  await setOptionAvailable("sheep", "naeemi", 1, false);
  await page.goto("/en/cart");
  await expect(page.getByTestId("cart-line")).toHaveAttribute("data-problem", "unavailable");
  await expect(page.getByText("No longer available")).toBeVisible();
  await expect(page.getByTestId("cart-total")).toHaveText("AED 0");
  await expect(page.getByText("Remove the items marked above")).toBeVisible();
  await setOptionAvailable("sheep", "naeemi", 1, true);
});

test("coming from the Eid page pre-selects Udhiyah, and the cart works in Arabic", async ({ page }) => {
  await page.goto("/ar/seasonal/eid-al-adha");
  await page.getByTestId("breed-card").filter({ hasText: "نعيمي" }).click();
  await expect(page.locator("select[name=occasion]")).toHaveValue("udhiyah");
  const builder = page.getByTestId("order-builder");
  await builder.getByTestId("option-row").first().click();
  await builder.getByTestId("cutting-choice").first().click();
  await page.locator("input[name=onBehalfOf]").fill("محمد");
  await builder.getByTestId("add-to-cart").click();
  await expect(builder.getByTestId("builder-message")).toContainText("تمت الإضافة");
  await page.goto("/ar/cart");
  await expect(page.getByTestId("cart-line")).toContainText("أضحية");
  await expect(page.getByTestId("cart-line")).toContainText("محمد");
  await expect(page.getByTestId("cart-total")).toHaveText("1,143 د.إ");
});
