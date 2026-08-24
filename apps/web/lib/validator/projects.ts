import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required'),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Slug can only contain alphanumeric characters, hyphens, and underscores'),
});

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required').optional(),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Slug can only contain alphanumeric characters, hyphens, and underscores')
    .optional(),
});

export type UpdateProjectFormValues = z.infer<typeof updateProjectSchema>;
