export type TargetType = 'IP_ADDRESS' | 'HOSTNAME' | 'DOMAIN';
export type TargetStatus = 'ACTIVE' | 'INACTIVE';

export interface Target {
  id: string;
  name: string;
  target: string;
  type: TargetType;
  projectId: string;
  projectName?: string;
  status: TargetStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTargetRequest {
  name: string;
  target: string;
  type: TargetType;
  projectId: string;
}

export interface UpdateTargetRequest {
  name?: string;
  target?: string;
  type?: TargetType;
  status?: TargetStatus;
}
