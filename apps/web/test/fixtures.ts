import type { Scan } from '@/types/scans';

/**
 * Builds a scan object matching the serialized backend response shape
 * (nullable timestamps/raw-output fields included).
 */
export function makeScan(overrides: Partial<Scan> = {}): Scan {
  return {
    id: 'scan-1',
    name: 'Test Scan',
    targetId: 'target-1',
    targetName: 'Lab Target',
    targetValue: '10.0.0.1',
    projectId: 'project-1',
    projectName: 'Lab Project',
    scanType: 'PORT_SCAN',
    executionMode: 'LOCAL',
    scanner: 'Local Process Engine',
    status: 'COMPLETED',
    findingsCount: 0,
    startedAt: '2026-09-25T10:00:00.000Z',
    completedAt: '2026-09-25T10:05:00.000Z',
    createdAt: '2026-09-25T09:59:00.000Z',
    updatedAt: '2026-09-25T10:05:00.000Z',
    rawOutput: null,
    errorDetails: null,
    ...overrides,
  };
}

/**
 * Minimal Response-shaped object so tests do not depend on undici/jsdom
 * globals. `apiRequest` only consumes ok/status/statusText/headers/json/text.
 */
export function jsonResponse(status: number, body: unknown, statusText = ''): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    headers: {
      get: (name: string) => (name.toLowerCase() === 'content-type' ? 'application/json' : null),
    },
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}
