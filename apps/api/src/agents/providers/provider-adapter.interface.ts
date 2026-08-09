export interface AgentExecutionOptions {
  provider: string;
  model: string;
  prompt: string;
  apiKey: string;
}

export interface ProviderAdapter {
  execute(options: AgentExecutionOptions): Promise<{ output: string }>;
}
