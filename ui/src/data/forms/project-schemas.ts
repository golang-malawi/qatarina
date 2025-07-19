import { z } from 'zod';

// Project creation schema
export const projectCreationSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  version: z.string().min(1, 'Version is required'),
  website_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

export type ProjectCreationFormValues = z.infer<typeof projectCreationSchema>;

// Project update schema
export const projectUpdateSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  version: z.string().min(1, 'Version is required'),
  website_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

export type ProjectUpdateFormValues = z.infer<typeof projectUpdateSchema>; 