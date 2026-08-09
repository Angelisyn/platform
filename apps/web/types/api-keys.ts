export interface ApiKey {
  id: string;
  provider: string;
  key: string;
  createdAt: string;
}

export interface CreateApiKeyRequest {
  provider: string;
  key: string;
}

export interface UpdateApiKeyRequest {
  provider?: string;
  key?: string;
}
