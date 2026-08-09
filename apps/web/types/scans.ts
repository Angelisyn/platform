export type ScanType = 'NETWORK_DISCOVERY' | 'PORT_SCAN' | 'VULNERABILITY_SCAN' | 'WEB_ASSESSMENT';
export type ScanExecutionMode = 'LOCAL';
export type ScanStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

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
  startedAt?: string;
  completedAt?: string;
  duration?: string;
  createdAt: string;
  rawOutput?: string;
  errorDetails?: string;
}

export interface CreateScanRequest {
  name: string;
  targetId: string;
  projectId: string;
  scanType: ScanType;
}
