import { z } from 'zod';

export const validTargetTypes = ['IP_ADDRESS', 'HOSTNAME', 'DOMAIN'] as const;
export const validTargetStatuses = ['ACTIVE', 'INACTIVE'] as const;

export const createTargetSchema = z.object({
  name: z.string().trim().min(2, 'Target name must be at least 2 characters'),
  target: z.string().trim().min(3, 'Target IP, hostname, or domain is required'),
  type: z.enum(validTargetTypes, {
    message: 'Select a valid target type (IP_ADDRESS, HOSTNAME, or DOMAIN)',
  }),
  projectId: z.string().trim().min(1, 'Project selection is required'),
});

export type CreateTargetInput = z.infer<typeof createTargetSchema>;

export const updateTargetSchema = z.object({
  name: z.string().trim().min(2, 'Target name must be at least 2 characters').optional(),
  target: z.string().trim().min(3, 'Target IP, hostname, or domain is required').optional(),
  type: z.enum(validTargetTypes, {
    message: 'Select a valid target type (IP_ADDRESS, HOSTNAME, or DOMAIN)',
  }).optional(),
  status: z.enum(validTargetStatuses, {
    message: 'Select a valid target status (ACTIVE or INACTIVE)',
  }).optional(),
});

export type UpdateTargetInput = z.infer<typeof updateTargetSchema>;
