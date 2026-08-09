import { z } from 'zod';

export const createAgentSchema = z.object({
  name: z.string().min(1, 'Agent name is required'),
  provider: z.string().min(1, 'Provider is required'),
  model: z.string().min(1, 'Model is required'),
  projectId: z.string().min(1, 'Project ID is required'),
});

export type CreateAgentFormValues = z.infer<typeof createAgentSchema>;

export const updateAgentSchema = z.object({
  name: z.string().min(1, 'Agent name is required').optional(),
  provider: z.string().min(1, 'Provider is required').optional(),
  model: z.string().min(1, 'Model is required').optional(),
  projectId: z.string().min(1, 'Project ID is required').optional(),
});

export type UpdateAgentFormValues = z.infer<typeof updateAgentSchema>;
