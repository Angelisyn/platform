export type ScanType = 'NETWORK_DISCOVERY' | 'PORT_SCAN' | 'VULNERABILITY_SCAN' | 'WEB_ASSESSMENT';
export type ScanExecutionMode = 'LOCAL';
export type ScanStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

/**
 * Serialized scan shape returned by the backend.
 *
 * Notes on fidelity with `apps/api`:
 * - `GET /scans` and `GET /scans/:id` return the scan row plus flattened
 *   `targetName`, `targetValue`, `projectName`, and `findingsCount`.
 * - `GET /targets/:id/scans` and `POST /scans` return the scan row plus
 *   `findingsCount` only, so the relation-derived names are absent here
 *   (hence optional).
 * - `startedAt`, `completedAt`, `rawOutput`, and `errorDetails` are nullable
 *   columns and are serialized as explicit `null` values, not omitted keys.
 * - There is no `duration` field in the backend response; duration is derived
 *   from `startedAt`/`completedAt` in the UI when needed.
 */
export interface Scan {
  id: string;
  name: string;
  targetId: string;
  targetName?: string;
  targetValue?: string;
  projectId: string;
  projectName?: string;
  scanType: ScanType;
  executionMode: ScanExecutionMode;
  scanner: string;
  status: ScanStatus;
  findingsCount: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  rawOutput: string | null;
  errorDetails: string | null;
}

export interface CreateScanRequest {
  name: string;
  targetId: string;
  projectId: string;
  scanType: ScanType;
}
