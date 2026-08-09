import { apiRequest } from '@/lib/api';
import type { CreateProjectRequest, Project, UpdateProjectRequest } from '@/types/projects';

export class ProjectsService {
  async getAll(token?: string): Promise<Project[]> {
    const authToken = token ?? (typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? undefined : undefined);
    return apiRequest<Project[]>('/projects', {
      token: authToken,
    });
  }

  async getById(id: string, token?: string): Promise<Project> {
    const authToken = token ?? (typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? undefined : undefined);
    return apiRequest<Project>(`/projects/${id}`, {
      token: authToken,
    });
  }

  async create(data: CreateProjectRequest, token?: string): Promise<Project> {
    const authToken = token ?? (typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? undefined : undefined);
    return apiRequest<Project, CreateProjectRequest>('/projects', {
      method: 'POST',
      body: data,
      token: authToken,
    });
  }

  async update(id: string, data: UpdateProjectRequest, token?: string): Promise<Project> {
    const authToken = token ?? (typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? undefined : undefined);
    return apiRequest<Project, UpdateProjectRequest>(`/projects/${id}`, {
      method: 'PATCH',
      body: data,
      token: authToken,
    });
  }

  async delete(id: string, token?: string): Promise<Project> {
    const authToken = token ?? (typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? undefined : undefined);
    return apiRequest<Project>(`/projects/${id}`, {
      method: 'DELETE',
      token: authToken,
    });
  }
}

export const projectsService = new ProjectsService();
