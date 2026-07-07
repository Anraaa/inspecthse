import { test, expect } from "@playwright/test";

test.describe("Main Flow", () => {
  test("should have responsive layout", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/login");
    await expect(page.locator("h1")).toBeVisible();

    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(page.locator("h1")).toBeVisible();
  });

  test("should display error page for unknown routes", async ({ page }) => {
    await page.goto("/unknown-route");
    await expect(page.locator("text=404")).toBeVisible();
  });
});
