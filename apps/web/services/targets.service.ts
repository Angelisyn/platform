import { apiRequest } from '@/lib/api';
import type { Target, CreateTargetRequest, UpdateTargetRequest } from '@/types/targets';

export class TargetsService {
  private getToken(token?: string): string | undefined {
    return token ?? (typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? undefined : undefined);
  }

  async getAll(token?: string): Promise<Target[]> {
    try {
      return await apiRequest<Target[]>('/targets', { token: this.getToken(token) });
    } catch {
      return [];
    }
  }

  async getById(id: string, token?: string): Promise<Target | null> {
    try {
      return await apiRequest<Target>(`/targets/${id}`, { token: this.getToken(token) });
    } catch {
      return null;
    }
  }

  async getByProject(projectId: string, token?: string): Promise<Target[]> {
    try {
      return await apiRequest<Target[]>(`/projects/${projectId}/targets`, { token: this.getToken(token) });
    } catch {
      return [];
    }
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

  async delete(id: string, token?: string): Promise<void> {
    await apiRequest<void>(`/targets/${id}`, {
      method: 'DELETE',
      token: this.getToken(token),
    });
  }
}

export const targetsService = new TargetsService();
