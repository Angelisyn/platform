export interface ModelDefinition {
  id: string;
  name: string;
  description?: string;
}

export interface ProviderDefinition {
  id: string;
  name: string;
  executionSupported: boolean;
  models: ModelDefinition[];
}

export const PROVIDER_REGISTRY: Record<string, ProviderDefinition> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    executionSupported: true,
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', description: 'Flagship high-intelligence model' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast, cost-efficient small model' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'High-capability multimodal model' },
      { id: 'gpt-4', name: 'GPT-4', description: 'Classic GPT-4 model' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast legacy chat model' },
    ],
  },
};

export function getSupportedProviders(): ProviderDefinition[] {
  return Object.values(PROVIDER_REGISTRY).filter((p) => p.executionSupported);
}

export function getAllProviders(): ProviderDefinition[] {
  return Object.values(PROVIDER_REGISTRY);
}

export function getProvider(providerId: string): ProviderDefinition | undefined {
  if (!providerId) return undefined;
  return PROVIDER_REGISTRY[providerId.toLowerCase().trim()];
}

export function isValidProvider(providerId: string): boolean {
  const provider = getProvider(providerId);
  return Boolean(provider && provider.executionSupported);
}

export function getModelsForProvider(providerId: string): ModelDefinition[] {
  const provider = getProvider(providerId);
  return provider ? provider.models : [];
}

export function isValidModel(providerId: string, modelId: string): boolean {
  if (!providerId || !modelId) return false;
  const models = getModelsForProvider(providerId);
  return models.some((m) => m.id === modelId.trim());
}
