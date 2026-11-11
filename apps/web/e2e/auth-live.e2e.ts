import { randomBytes, randomUUID } from 'node:crypto';

import { expect, mockDashboardApi, test } from './fixtures';

test.use({ trace: 'off' });

test.skip(
  process.env.PLAYWRIGHT_RUN_LIVE_AUTH !== '1',
  'Live auth requires explicit local API and isolated-database configuration.',
);

test('live auth API registers and logs in with a unique test account', async ({ page }) => {
  const account = {
    name: 'Playwright Isolated User',
    email: `playwright-${randomUUID()}@example.test`,
    password: randomBytes(24).toString('base64url'),
  };
  await mockDashboardApi(page);

  await page.goto('/register');
  await page.getByPlaceholder('Security Analyst').fill(account.name);
  await page.getByPlaceholder('name@example.com').fill(account.email);
  const passwords = page.locator('input[type="password"]');
  await passwords.nth(0).fill(account.password);
  await passwords.nth(1).fill(account.password);
  await page.getByRole('button', { name: 'Create Account' }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(account.email, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByPlaceholder('name@example.com').fill(account.email);
  await page.locator('input[type="password"]').fill(account.password);
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(account.email, { exact: true })).toBeVisible();
});
