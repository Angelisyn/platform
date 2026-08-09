import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  slug: z.string().min(1, 'Slug is required'),
});

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').optional(),
  slug: z.string().min(1, 'Slug is required').optional(),
});

export type UpdateProjectFormValues = z.infer<typeof updateProjectSchema>;
