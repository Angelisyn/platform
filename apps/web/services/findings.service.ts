import { apiRequest } from '@/lib/api';
import type { Finding } from '@/types/findings';

export class FindingsService {
  private getToken(token?: string): string | undefined {
    return token ?? (typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? undefined : undefined);
  }

  async getAll(token?: string): Promise<Finding[]> {
    try {
      return await apiRequest<Finding[]>('/findings', { token: this.getToken(token) });
    } catch {
      return [];
    }
  }

  async getById(id: string, token?: string): Promise<Finding | null> {
    try {
      return await apiRequest<Finding>(`/findings/${id}`, { token: this.getToken(token) });
    } catch {
      return null;
    }
  }

  async getByScan(scanId: string, token?: string): Promise<Finding[]> {
    try {
      return await apiRequest<Finding[]>(`/scans/${scanId}/findings`, { token: this.getToken(token) });
    } catch {
      return [];
    }
  }

  async getByTarget(targetId: string, token?: string): Promise<Finding[]> {
    try {
      return await apiRequest<Finding[]>(`/targets/${targetId}/findings`, { token: this.getToken(token) });
    } catch {
      return [];
    }
  }
}

export const findingsService = new FindingsService();
