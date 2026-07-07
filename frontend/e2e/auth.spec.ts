import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should show login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("InspectHSE");
    await expect(page.getByPlaceholder("user@example.com")).toBeVisible();
    await expect(page.getByPlaceholder("••••••••")).toBeVisible();
    await expect(page.getByRole("button", { name: "Masuk" })).toBeVisible();
  });

  test("should show error with invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("user@example.com").fill("wrong@test.com");
    await page.getByPlaceholder("••••••••").fill("wrongpass");
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page.locator("text=Email atau password salah")).toBeVisible({ timeout: 10000 });
  });

  test("should redirect to login when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/login");
  });
});

test.describe("Navigation", () => {
  test("should have correct page title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/InspectHSE/);
  });
});
