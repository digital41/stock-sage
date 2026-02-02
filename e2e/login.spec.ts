import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'KlyStock' })).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Mot de passe')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByPlaceholder('Email').fill('invalid@test.com');
    await page.getByPlaceholder('Mot de passe').fill('wrongpassword');
    await page.getByRole('button', { name: 'Se connecter' }).click();

    await expect(page.getByText('Email ou mot de passe incorrect')).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login');

    const passwordInput = page.getByPlaceholder('Mot de passe');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click eye icon to show password
    await page.getByLabel('Afficher le mot de passe').click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click again to hide password
    await page.getByLabel('Masquer le mot de passe').click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
