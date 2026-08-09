import { z } from 'zod';

const validTargetTypes = ['IP_ADDRESS', 'HOSTNAME', 'DOMAIN'] as const;

export const createTargetSchema = z.object({
  name: z.string().min(2, 'Target name must be at least 2 characters'),
  target: z.string().min(3, 'Target IP, hostname, or domain is required'),
  type: z.enum(validTargetTypes, {
    message: 'Select a valid target type',
  }),
  projectId: z.string().min(1, 'Project selection is required'),
});

export type CreateTargetInput = z.infer<typeof createTargetSchema>;
