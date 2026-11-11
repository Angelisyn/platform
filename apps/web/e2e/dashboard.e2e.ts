import {
  expect,
  mockAuthenticatedSession,
  mockDashboardApi,
  routeApi,
  test,
} from './fixtures';

test.describe('dashboard overview', () => {
  test('renders dashboard metrics and empty sections', async ({ page }) => {
    await mockAuthenticatedSession(page);
    await mockDashboardApi(page);

    await page.goto('/dashboard');

    await expect(
      page.getByRole('heading', { name: 'Security Overview' }),
    ).toBeVisible();
    await expect(page.getByText('Total Projects')).toBeVisible();
    await expect(page.getByText('No local scans executed yet.')).toBeVisible();
    await expect(page.getByText('No vulnerabilities or findings reported.')).toBeVisible();
  });

  test('shows an API error when overview data cannot be loaded', async ({ page }) => {
    await mockAuthenticatedSession(page);
    await mockDashboardApi(page, {
      findings: {
        status: 503,
        body: { message: 'Test API unavailable' },
      },
    });

    await page.goto('/dashboard');

    await expect(page.getByText('Test API unavailable')).toBeVisible();
  });
});

test.describe('projects', () => {
  test('renders the empty state', async ({ page }) => {
    await mockAuthenticatedSession(page);
    await mockDashboardApi(page);

    await page.goto('/dashboard/projects');

    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
    await expect(page.getByText('No projects yet')).toBeVisible();
    await expect(
      page.getByRole('button', { name: '+ Create Your First Project' }),
    ).toBeVisible();
  });

  test('renders a populated projects list', async ({ page }) => {
    await mockAuthenticatedSession(page);
    await mockDashboardApi(page, {
      projects: {
        body: [
          {
            id: 'project-e2e',
            name: 'Isolated Project',
            slug: 'isolated-project',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
    });

    await page.goto('/dashboard/projects');

    await expect(page.getByRole('link', { name: 'Isolated Project' })).toBeVisible();
    await expect(page.getByText('/isolated-project')).toBeVisible();
  });

  test('shows loading and API error states', async ({ page }) => {
    let releaseProjects!: () => void;
    const projectsResponse = new Promise<void>((resolve) => {
      releaseProjects = resolve;
    });

    await mockAuthenticatedSession(page);
    await mockDashboardApi(page, {
      projects: {
        waitUntil: projectsResponse,
        body: [],
      },
    });

    await page.goto('/dashboard/projects');
    try {
      await expect(page.getByText('Loading projects...')).toBeVisible();
    } finally {
      releaseProjects();
    }
    await expect(page.getByText('No projects yet')).toBeVisible();

    await routeApi(page, '/projects', (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Projects API unavailable' }),
      }),
    );
    await page.reload();

    await expect(page.getByText('Projects API unavailable')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
  });

  test('navigates between dashboard sections', async ({ page }) => {
    await mockAuthenticatedSession(page);
    await mockDashboardApi(page);
    await page.goto('/dashboard');

    await page
      .locator('aside')
      .getByRole('link', { name: 'Projects' })
      .click();
    await page.waitForURL(/\/dashboard\/projects$/, { timeout: 20_000 });
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();

    await page
      .locator('aside')
      .getByRole('link', { name: 'Overview' })
      .click();
    await page.waitForURL(/\/dashboard$/, { timeout: 20_000 });
    await expect(
      page.getByRole('heading', { name: 'Security Overview' }),
    ).toBeVisible();
  });
});
