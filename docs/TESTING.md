# Angelisyn Testing Strategy

## Goals
Tests should provide confidence in correctness, security and regression resistance.

## Test Layers

### Unit
Test isolated functions, services and utilities.

### Integration
Test interactions between modules, databases and external boundaries where appropriate.

### End-to-End
Test important user and API workflows.

### Build / Type
Type checking and production builds are verification layers, not substitutes for behavioral tests.

The web application uses Playwright with Chromium:

```powershell
pnpm --filter web test:e2e
pnpm --filter web test:e2e:ui
```

The Playwright configuration starts the web development server when needed and
reuses an existing local server for the mocked E2E suite. Authentication and
dashboard API responses are mocked by default; these tests do not access a
database, create projects, or start scans. Screenshots, traces, and the HTML
report are saved under `apps/web/test-results/` on failures and
`apps/web/playwright-report/` after each run. Tracing is disabled for live auth
because traces may contain authentication request/response data.

### Live Authentication E2E
The live registration/login flow is opt-in. Before running it, start the API
with its database configured to a dedicated local test database containing no
user data that must be preserved. The API is never started by Playwright.
Configure the following in the test shell:

```powershell
$env:PLAYWRIGHT_RUN_LIVE_AUTH = "1"
$env:PLAYWRIGHT_TEST_API_URL = "http://localhost:3001"
$env:PLAYWRIGHT_TEST_DB_ISOLATED = "1"
pnpm --filter web test:e2e
```

The live API URL must be loopback (`localhost`, `127.0.0.1`, or `::1`) and the
database-isolation acknowledgement must be set. The API's CORS origin must
allow the configured local web URL (`http://localhost:3000`). The live test
registers a randomly named `example.test` account, logs out, and signs in with
it. The API currently has no user-delete endpoint, so that unique account
remains in the isolated test database; no existing data is deleted. Do not
enable this mode with a production or shared database.

## Test Placement
Follow the repository's existing conventions. Do not create a second testing structure without a reason.

## Required Verification
Choose checks based on the affected area:
- typecheck
- lint
- unit tests
- integration tests
- end-to-end tests
- build

## Security Testing
Only test systems and environments for which authorization exists.

## Test Data
Do not use real credentials, secrets or sensitive production data.

## Failure Handling
When a test fails, identify the root cause rather than weakening the assertion or disabling the test.
