import { apiRequest } from '@/lib/api';
import type { Finding } from '@/types/findings';

export class FindingsService {
  private getToken(token?: string): string | undefined {
    return token ?? (typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? undefined : undefined);
  }

  async getAll(token?: string): Promise<Finding[]> {
    return apiRequest<Finding[]>('/findings', { token: this.getToken(token) });
  }

  async getById(id: string, token?: string): Promise<Finding> {
    return apiRequest<Finding>(`/findings/${id}`, { token: this.getToken(token) });
  }

  async getByScan(scanId: string, token?: string): Promise<Finding[]> {
    return apiRequest<Finding[]>(`/scans/${scanId}/findings`, { token: this.getToken(token) });
  }

  async getByTarget(targetId: string, token?: string): Promise<Finding[]> {
    return apiRequest<Finding[]>(`/targets/${targetId}/findings`, { token: this.getToken(token) });
  }
}

export const findingsService = new FindingsService();
