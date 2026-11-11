import { randomBytes, randomUUID } from 'node:crypto';

import {
  expect,
  mockAuthenticatedSession,
  mockDashboardApi,
  respondWithAuth,
  routeApi,
  test,
} from './fixtures';

function createTestCredentials() {
  return {
    name: 'Playwright Isolated User',
    email: `playwright-${randomUUID()}@example.test`,
    password: randomBytes(24).toString('base64url'),
  };
}

test.describe('authentication pages', () => {
  test('renders the registration form', async ({ page }) => {
    await page.goto('/register');

    await expect(
      page.getByRole('heading', { name: 'Create Account' }),
    ).toBeVisible();
    await expect(page.getByPlaceholder('Security Analyst')).toBeVisible();
    await expect(page.getByPlaceholder('name@example.com')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  });

  test('shows validation messages for required registration fields', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page.getByText('Name must be at least 2 characters')).toBeVisible();
    await expect(page.getByText('Enter a valid email address')).toBeVisible();
    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
  });

  test('rejects an invalid email and a password that is too short', async ({ page }) => {
    await page.goto('/register');
    const email = page.getByPlaceholder('name@example.com');

    await email.fill('not-an-email');
    await page.getByRole('button', { name: 'Create Account' }).click();
    expect(
      await email.evaluate((input) => (input as HTMLInputElement).validity.typeMismatch),
    ).toBe(true);

    await page.getByPlaceholder('Security Analyst').fill('Test User');
    await email.fill('analyst@example.test');
    const passwords = page.locator('input[type="password"]');
    await passwords.nth(0).fill('short');
    await passwords.nth(1).fill('short');
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
  });

  test('registers a unique isolated mock account', async ({ page }) => {
    const account = createTestCredentials();
    await mockDashboardApi(page);
    await routeApi(page, '/auth/register', async (route) => {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      expect(
        body.email === account.email &&
          body.name === account.name &&
          body.password === account.password,
      ).toBe(true);
      await respondWithAuth(route, account.email, account.name);
    });

    await page.goto('/register');
    await page.getByPlaceholder('Security Analyst').fill(account.name);
    await page.getByPlaceholder('name@example.com').fill(account.email);
    const passwords = page.locator('input[type="password"]');
    await passwords.nth(0).fill(account.password);
    await passwords.nth(1).fill(account.password);
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole('heading', { name: 'Security Overview' }),
    ).toBeVisible();
    await expect(page.getByText(account.email, { exact: true })).toBeVisible();
  });

  test('logs in with valid credentials', async ({ page }) => {
    const account = createTestCredentials();
    await mockDashboardApi(page);
    await routeApi(page, '/auth/login', async (route) => {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      expect(body.email === account.email && body.password === account.password).toBe(true);
      await respondWithAuth(route, account.email, account.name);
    });

    await page.goto('/login');
    await page.getByPlaceholder('name@example.com').fill(account.email);
    await page.locator('input[type="password"]').fill(account.password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText(account.email, { exact: true })).toBeVisible();
  });

  test('shows an error for invalid login credentials', async ({ page }) => {
    await routeApi(page, '/auth/login', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid email or password' }),
      }),
    );

    await page.goto('/login');
    await page.getByPlaceholder('name@example.com').fill('unknown@example.test');
    await page.locator('input[type="password"]').fill('invalid-password');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByText('Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe('protected dashboard access', () => {
  test('allows dashboard access after authentication', async ({ page }) => {
    await mockAuthenticatedSession(page);
    await mockDashboardApi(page, {
      projects: {
        body: [
          {
            id: 'project-e2e',
            name: 'Isolated Dashboard Project',
            slug: 'isolated-dashboard-project',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
    });

    await page.goto('/dashboard');

    await expect(
      page.getByRole('heading', { name: 'Security Overview' }),
    ).toBeVisible();
    await expect(page.getByText('Total Projects')).toBeVisible();
  });

  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard/projects');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });

  test('logs out and protects dashboard routes again', async ({ page }) => {
    await mockAuthenticatedSession(page);
    await mockDashboardApi(page);
    await page.goto('/dashboard');

    await expect(
      page.getByRole('heading', { name: 'Security Overview' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Log out' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
    expect(await page.evaluate(() => localStorage.getItem('access_token'))).toBeNull();
  });
});
