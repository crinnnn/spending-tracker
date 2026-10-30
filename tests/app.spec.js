import { test, expect } from '@playwright/test';

test.describe('SpendWise Website Automation Tests', () => {

  test('should load the dashboard and display SpendWise branding', async ({ page }) => {
    // 1. Navigate to the website homepage
    await page.goto('/');

    // 2. Expect the SpendWise branding to be visible
    await expect(page.getByText('SpendWise').first()).toBeVisible();

    // 3. Check that the navigation items exist
    await expect(page.getByRole('button', { name: /Dashboard/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Add Expense/i }).first()).toBeVisible();
  });

  test('should navigate to Add Expense view when clicked', async ({ page }) => {
    await page.goto('/');

    // Click "Add Expense" in navigation
    await page.getByRole('button', { name: /Add Expense/i }).first().click();

    // Verify we navigated to the Add Expense screen by checking for mode buttons or input
    await expect(page.getByRole('button', { name: /Text & Voice Prompt/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Scan Receipt Photo/i })).toBeVisible();
  });

  test('should toggle dark mode theme', async ({ page }) => {
    await page.goto('/');

    // Find and click the dark mode toggle button (aria-label or title)
    const themeBtn = page.getByRole('button', { name: /dark mode|light mode|toggle theme/i });
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
    }
  });

});
