import { apiRequest } from '@/lib/api';
import type { Report, CreateReportRequest } from '@/types/reports';

export class ReportsService {
  private getToken(token?: string): string | undefined {
    return token ?? (typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? undefined : undefined);
  }

  async getAll(token?: string): Promise<Report[]> {
    try {
      return await apiRequest<Report[]>('/reports', { token: this.getToken(token) });
    } catch {
      return [];
    }
  }

  async getById(id: string, token?: string): Promise<Report | null> {
    try {
      return await apiRequest<Report>(`/reports/${id}`, { token: this.getToken(token) });
    } catch {
      return null;
    }
  }

  async create(data: CreateReportRequest, token?: string): Promise<Report> {
    return apiRequest<Report, CreateReportRequest>('/reports', {
      method: 'POST',
      body: data,
      token: this.getToken(token),
    });
  }
}

export const reportsService = new ReportsService();
