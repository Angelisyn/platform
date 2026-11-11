import { defineConfig, devices } from '@playwright/test';

const webUrl = 'http://localhost:3000';
const runLiveAuth = process.env.PLAYWRIGHT_RUN_LIVE_AUTH === '1';

function getLocalTestApiUrl(): string {
  const configuredUrl = process.env.PLAYWRIGHT_TEST_API_URL;

  if (!configuredUrl) {
    throw new Error(
      'Live auth E2E requires PLAYWRIGHT_TEST_API_URL pointing to the local test API.',
    );
  }

  let url: URL;
  try {
    url = new URL(configuredUrl);
  } catch {
    throw new Error('PLAYWRIGHT_TEST_API_URL must be a valid loopback HTTP URL.');
  }

  const localHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
  if (
    url.protocol !== 'http:' ||
    !localHosts.has(url.hostname) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error('Live auth E2E is restricted to a loopback HTTP API URL.');
  }

  if (process.env.PLAYWRIGHT_TEST_DB_ISOLATED !== '1') {
    throw new Error(
      'Set PLAYWRIGHT_TEST_DB_ISOLATED=1 only after configuring the API to use a dedicated local test database.',
    );
  }

  return url.origin;
}

const apiUrl = runLiveAuth ? getLocalTestApiUrl() : 'http://localhost:3001';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  outputDir: 'test-results',
  use: {
    baseURL: webUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm exec next dev --hostname 127.0.0.1 --port 3000',
    cwd: process.cwd(),
    url: webUrl,
    reuseExistingServer: !process.env.CI && !runLiveAuth,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_API_URL: apiUrl,
    },
  },
});
