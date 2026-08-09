export interface ApiKey {
  id: string;
  name: string | null;
  provider: string;
  keyMasked: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApiKeyRequest {
  name?: string;
  provider: string;
  key: string;
}
