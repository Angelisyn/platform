import { z } from 'zod';

export const createApiKeySchema = z.object({
  provider: z.string().min(1, 'Provider is required'),
  key: z.string().min(1, 'API key is required'),
});

export type CreateApiKeyFormValues = z.infer<typeof createApiKeySchema>;

export const updateApiKeySchema = z.object({
  provider: z.string().min(1, 'Provider is required').optional(),
  key: z.string().min(1, 'API key is required').optional(),
});

export type UpdateApiKeyFormValues = z.infer<typeof updateApiKeySchema>;
