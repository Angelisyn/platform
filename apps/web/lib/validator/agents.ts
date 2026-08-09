import { z } from 'zod';
import { isValidModel, isValidProvider } from '@angelisyn/types';

export const createAgentSchema = z
  .object({
    name: z.string().min(1, 'Agent name is required'),
    provider: z
      .string()
      .min(1, 'Provider is required')
      .refine((val) => isValidProvider(val), {
        message: 'Invalid or unsupported provider',
      }),
    model: z.string().min(1, 'Model is required'),
    projectId: z.string().min(1, 'Project ID is required'),
  })
  .refine((data) => isValidModel(data.provider, data.model), {
    message: 'Selected model is not supported for this provider',
    path: ['model'],
  });

export type CreateAgentFormValues = z.infer<typeof createAgentSchema>;

export const updateAgentSchema = z
  .object({
    name: z.string().min(1, 'Agent name is required').optional(),
    provider: z.string().min(1, 'Provider is required').optional(),
    model: z.string().min(1, 'Model is required').optional(),
    projectId: z.string().min(1, 'Project ID is required').optional(),
  })
  .refine(
    (data) => {
      if (data.provider && !isValidProvider(data.provider)) {
        return false;
      }
      if (data.provider && data.model) {
        return isValidModel(data.provider, data.model);
      }
      return true;
    },
    {
      message: 'Invalid provider or model combination',
      path: ['model'],
    },
  );

export type UpdateAgentFormValues = z.infer<typeof updateAgentSchema>;
