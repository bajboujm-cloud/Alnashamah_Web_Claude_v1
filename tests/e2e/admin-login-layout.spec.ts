import { expect, test } from "@playwright/test";

// Issue #6: the sign-in button sat on top of the password box because the form's spacing did not reach
// the fields. Every admin form uses the same ActionForm, so this guards all of them.
for (const lang of ["ar", "en"] as const) {
  test(`${lang} sign-in button sits below the password box with a gap`, async ({ page }) => {
    await page.goto(`/${lang}/admin/login`);
    const box = await page.locator('input[name="password"]').boundingBox();
    const button = await page.locator('button[type="submit"]').boundingBox();
    expect(box && button).toBeTruthy();
    expect(button!.y - (box!.y + box!.height)).toBeGreaterThanOrEqual(12);
  });
}
