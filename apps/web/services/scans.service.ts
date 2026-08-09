import { apiRequest } from '@/lib/api';
import type { Scan, CreateScanRequest } from '@/types/scans';

export class ScansService {
  private getToken(token?: string): string | undefined {
    return token ?? (typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? undefined : undefined);
  }

  async getAll(token?: string): Promise<Scan[]> {
    try {
      return await apiRequest<Scan[]>('/scans', { token: this.getToken(token) });
    } catch {
      return [];
    }
  }

  async getById(id: string, token?: string): Promise<Scan | null> {
    try {
      return await apiRequest<Scan>(`/scans/${id}`, { token: this.getToken(token) });
    } catch {
      return null;
    }
  }

  async getByTarget(targetId: string, token?: string): Promise<Scan[]> {
    try {
      return await apiRequest<Scan[]>(`/targets/${targetId}/scans`, { token: this.getToken(token) });
    } catch {
      return [];
    }
  }

  async create(data: CreateScanRequest, token?: string): Promise<Scan> {
    return apiRequest<Scan, CreateScanRequest>('/scans', {
      method: 'POST',
      body: data,
      token: this.getToken(token),
    });
  }

  async cancel(id: string, token?: string): Promise<void> {
    await apiRequest<void>(`/scans/${id}/cancel`, {
      method: 'POST',
      token: this.getToken(token),
    });
  }
}

export const scansService = new ScansService();
