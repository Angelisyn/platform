import { apiRequest } from '@/lib/api';
import type { ApiKey, CreateApiKeyRequest } from '@/types/api-keys';

export class ApiKeysService {
  async getAll(token?: string): Promise<ApiKey[]> {
    const authToken =
      token ??
      (typeof window !== 'undefined'
        ? localStorage.getItem('access_token') ?? undefined
        : undefined);
    return apiRequest<ApiKey[]>('/api-keys', {
      token: authToken,
    });
  }

  async getById(id: string, token?: string): Promise<ApiKey> {
    const authToken =
      token ??
      (typeof window !== 'undefined'
        ? localStorage.getItem('access_token') ?? undefined
        : undefined);
    return apiRequest<ApiKey>(`/api-keys/${id}`, {
      token: authToken,
    });
  }

  async create(data: CreateApiKeyRequest, token?: string): Promise<ApiKey> {
    const authToken =
      token ??
      (typeof window !== 'undefined'
        ? localStorage.getItem('access_token') ?? undefined
        : undefined);
    return apiRequest<ApiKey, CreateApiKeyRequest>('/api-keys', {
      method: 'POST',
      body: data,
      token: authToken,
    });
  }

  async delete(id: string, token?: string): Promise<ApiKey> {
    const authToken =
      token ??
      (typeof window !== 'undefined'
        ? localStorage.getItem('access_token') ?? undefined
        : undefined);
    return apiRequest<ApiKey>(`/api-keys/${id}`, {
      method: 'DELETE',
      token: authToken,
    });
  }
}

export const apiKeysService = new ApiKeysService();
