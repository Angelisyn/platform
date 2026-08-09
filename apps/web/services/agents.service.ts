import { apiRequest } from '@/lib/api';
import type { Agent, CreateAgentRequest, UpdateAgentRequest } from '@/types/agents';

export class AgentsService {
  async getAll(token?: string): Promise<Agent[]> {
    const authToken = token ?? (typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? undefined : undefined);
    return apiRequest<Agent[]>('/agents', {
      token: authToken,
    });
  }

  async getById(id: string, token?: string): Promise<Agent> {
    const authToken = token ?? (typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? undefined : undefined);
    return apiRequest<Agent>(`/agents/${id}`, {
      token: authToken,
    });
  }

  async create(data: CreateAgentRequest, token?: string): Promise<Agent> {
    const authToken = token ?? (typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? undefined : undefined);
    return apiRequest<Agent, CreateAgentRequest>('/agents', {
      method: 'POST',
      body: data,
      token: authToken,
    });
  }

  async update(id: string, data: UpdateAgentRequest, token?: string): Promise<Agent> {
    const authToken = token ?? (typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? undefined : undefined);
    return apiRequest<Agent, UpdateAgentRequest>(`/agents/${id}`, {
      method: 'PATCH',
      body: data,
      token: authToken,
    });
  }

  async delete(id: string, token?: string): Promise<Agent> {
    const authToken = token ?? (typeof window !== 'undefined' ? localStorage.getItem('access_token') ?? undefined : undefined);
    return apiRequest<Agent>(`/agents/${id}`, {
      method: 'DELETE',
      token: authToken,
    });
  }
}

export const agentsService = new AgentsService();
