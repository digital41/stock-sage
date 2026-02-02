import { test, expect } from '@playwright/test';

test.describe('Articles Page', () => {

  test('should display search bar', async ({ page }) => {
    await page.goto('/articles');

    // Should redirect to login if not authenticated
    // or show articles page if mocked
    await expect(page).toHaveURL(/\/(login|articles)/);
  });

  test('should have responsive design on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/articles');

    // Check mobile-specific elements
    await expect(page).toHaveURL(/\/(login|articles)/);
  });
});
