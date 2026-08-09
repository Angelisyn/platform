import { z } from 'zod';
import { isValidProvider } from '@angelisyn/types';

export const createApiKeySchema = z.object({
  name: z.string().optional(),
  provider: z
    .string()
    .min(1, 'Provider is required')
    .refine((val) => isValidProvider(val), {
      message: 'Invalid or unsupported provider',
    }),
  key: z.string().min(1, 'API key is required'),
});

export type CreateApiKeyFormValues = z.infer<typeof createApiKeySchema>;
