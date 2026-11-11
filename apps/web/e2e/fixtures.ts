import { test as base, expect, type Page, type Route } from '@playwright/test';

interface ApiMockResponse {
  status?: number;
  body: unknown;
  waitUntil?: Promise<void>;
}

type DashboardEndpoint = 'projects' | 'targets' | 'scans' | 'findings';

type DashboardMocks = Partial<Record<DashboardEndpoint, ApiMockResponse>>;

const mockAccessToken = 'playwright-mock-token';
const webOrigin = 'http://localhost:3000';
const liveAuthEnabled = process.env.PLAYWRIGHT_RUN_LIVE_AUTH === '1';

export const mockUser = {
  id: 'playwright-user',
  name: 'Playwright Test User',
  email: 'playwright-user@example.test',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const apiOrigin = getApiOrigin();

function redactDiagnostic(value: string): string {
  return value
    .replace(/\bBearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(/\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[redacted token]')
    .replace(/([?&](?:access_token|token|api_key|key)=)[^&\s]*/gi, '$1[redacted]');
}

function getApiOrigin(): string {
  const configuredUrl =
    liveAuthEnabled
      ? process.env.PLAYWRIGHT_TEST_API_URL
      : 'http://localhost:3001';

  try {
    const url = new URL(configuredUrl ?? '');
    if (['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
      return url.origin;
    }
  } catch {
    return 'http://localhost:3001';
  }

  return 'http://localhost:3001';
}

function getApiPath(value: string): string | null {
  try {
    const url = new URL(value);
    const apiPaths = [
      '/auth/me',
      '/auth/login',
      '/auth/register',
      '/projects',
      '/targets',
      '/scans',
      '/findings',
    ];
    if (
      url.origin === webOrigin ||
      !apiPaths.some((path) => url.pathname === path || url.pathname.endsWith(path))
    ) {
      return null;
    }
    return url.pathname;
  } catch {
    return null;
  }
}

async function fulfillJson(route: Route, status: number, body: unknown): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function routeApiPath(
  page: Page,
  path: string,
  handler: (route: Route) => Promise<void>,
): Promise<void> {
  const expectedPath = path.startsWith('/') ? path : `/${path}`;
  await page.route(
    (url) =>
      url.origin === apiOrigin &&
      (url.pathname === expectedPath || url.pathname.endsWith(expectedPath)),
    handler,
  );
}

export const test = base.extend({
  page: async ({ page }, runTest, testInfo) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const failedApiRequests: string[] = [];
    const failedApiResponses: string[] = [];
    const blockedExternalRequests: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(redactDiagnostic(message.text()));
      }
    });
    page.on('pageerror', (error) => {
      pageErrors.push(redactDiagnostic(error.message));
    });
    page.on('requestfailed', (request) => {
      const path = getApiPath(request.url());
      if (path) {
        failedApiRequests.push(
          `${request.method()} ${path}: ${redactDiagnostic(request.failure()?.errorText ?? 'request failed')}`,
        );
      }
    });
    page.on('response', (response) => {
      const path = getApiPath(response.url());
      if (path && response.status() >= 400) {
        failedApiResponses.push(`${response.status()} ${path}`);
      }
    });
    await page.route(
      (url) =>
        !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname),
      (route) => {
        const requestUrl = new URL(route.request().url());
        blockedExternalRequests.push(
          `${route.request().method()} ${requestUrl.hostname}${requestUrl.pathname}`,
        );
        return route.abort('blockedbyclient');
      },
    );

    await runTest(page);

    if (
      consoleErrors.length > 0 ||
      pageErrors.length > 0 ||
      failedApiRequests.length > 0 ||
      failedApiResponses.length > 0 ||
      blockedExternalRequests.length > 0 ||
      testInfo.status !== testInfo.expectedStatus
    ) {
      const diagnostics = {
        consoleErrors,
        pageErrors,
        failedApiRequests,
        failedApiResponses,
        blockedExternalRequests,
      };
      await testInfo.attach('browser-diagnostics.json', {
        body: Buffer.from(JSON.stringify(diagnostics, null, 2)),
        contentType: 'application/json',
      });
      console.info(
        `Playwright diagnostics for "${testInfo.title}": ${JSON.stringify(diagnostics)}`,
      );
    }
  },
});

export { expect };

export async function mockAuthenticatedSession(page: Page): Promise<void> {
  await page.addInitScript((token) => {
    if (window.sessionStorage.getItem('playwright-auth-seeded') !== 'true') {
      window.localStorage.setItem('access_token', token);
      window.sessionStorage.setItem('playwright-auth-seeded', 'true');
    }
  }, mockAccessToken);

  await routeApiPath(page, '/auth/me', (route) =>
    fulfillJson(route, 200, mockUser),
  );
}

export async function mockDashboardApi(
  page: Page,
  overrides: DashboardMocks = {},
): Promise<void> {
  const endpoints: DashboardEndpoint[] = [
    'projects',
    'targets',
    'scans',
    'findings',
  ];

  for (const endpoint of endpoints) {
    const mock = overrides[endpoint] ?? { body: [] };
    await routeApiPath(page, `/${endpoint}`, async (route) => {
      await mock.waitUntil;
      await fulfillJson(route, mock.status ?? 200, mock.body);
    });
  }
}

export async function routeApi(
  page: Page,
  path: string,
  handler: (route: Route) => Promise<void>,
): Promise<void> {
  await routeApiPath(page, path, handler);
}

export async function respondWithAuth(
  route: Route,
  email: string,
  name = 'Playwright Test User',
): Promise<void> {
  await fulfillJson(route, 201, {
    access_token: mockAccessToken,
    user: {
      ...mockUser,
      email,
      name,
    },
  });
}
