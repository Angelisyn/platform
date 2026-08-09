export type FindingSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type FindingStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'FALSE_POSITIVE';

export interface Finding {
  id: string;
  title: string;
  severity: FindingSeverity;
  status: FindingStatus;
  targetId: string;
  targetName?: string;
  targetValue?: string;
  scanId: string;
  scanName?: string;
  projectId: string;
  projectName?: string;
  description: string;
  evidence?: string;
  impact?: string;
  recommendation?: string;
  cve?: string;
  port?: number;
  detectedAt: string;
}
