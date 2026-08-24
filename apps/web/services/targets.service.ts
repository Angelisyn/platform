import { apiRequest } from '@/lib/api';
import type { Target, CreateTargetRequest, UpdateTargetRequest } from '@/types/targets';
import type { Scan } from '@/types/scans';
import type { Finding } from '@/types/findings';

export class TargetsService {
  private getToken(token?: string): string | undefined {
    return token ?? (typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? undefined : undefined);
  }

  async getAll(token?: string): Promise<Target[]> {
    return apiRequest<Target[]>('/targets', {
      token: this.getToken(token),
    });
  }

  async getById(id: string, token?: string): Promise<Target> {
    return apiRequest<Target>(`/targets/${id}`, {
      token: this.getToken(token),
    });
  }

  async getByProject(projectId: string, token?: string): Promise<Target[]> {
    return apiRequest<Target[]>(`/projects/${projectId}/targets`, {
      token: this.getToken(token),
    });
  }

  async getScans(targetId: string, token?: string): Promise<Scan[]> {
    return apiRequest<Scan[]>(`/targets/${targetId}/scans`, {
      token: this.getToken(token),
    });
  }

  async getFindings(targetId: string, token?: string): Promise<Finding[]> {
    return apiRequest<Finding[]>(`/targets/${targetId}/findings`, {
      token: this.getToken(token),
    });
  }

  async create(data: CreateTargetRequest, token?: string): Promise<Target> {
    return apiRequest<Target, CreateTargetRequest>('/targets', {
      method: 'POST',
      body: data,
      token: this.getToken(token),
    });
  }

  async update(id: string, data: UpdateTargetRequest, token?: string): Promise<Target> {
    return apiRequest<Target, UpdateTargetRequest>(`/targets/${id}`, {
      method: 'PATCH',
      body: data,
      token: this.getToken(token),
    });
  }

  async delete(id: string, token?: string): Promise<Target> {
    return apiRequest<Target>(`/targets/${id}`, {
      method: 'DELETE',
      token: this.getToken(token),
    });
  }
}

export const targetsService = new TargetsService();
