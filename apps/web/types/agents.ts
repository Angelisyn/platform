export interface Agent {
  id: string;
  name: string;
  provider: string;
  model: string;
  projectId: string;
  createdAt: string;
}

export interface CreateAgentRequest {
  name: string;
  provider: string;
  model: string;
  projectId: string;
}

export interface UpdateAgentRequest {
  name?: string;
  provider?: string;
  model?: string;
  projectId?: string;
}

export interface ExecuteAgentRequest {
  prompt: string;
}

export interface AgentExecutionResponse {
  output: string;
  provider: string;
  model: string;
}
