export type ReportStatus = 'GENERATING' | 'READY' | 'FAILED';

export interface Report {
  id: string;
  name: string;
  projectId: string;
  projectName?: string;
  targetId?: string;
  targetName?: string;
  status: ReportStatus;
  findingsSummary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  generatedAt: string;
  downloadUrl?: string;
}

export interface CreateReportRequest {
  name: string;
  projectId: string;
  targetId?: string;
}
