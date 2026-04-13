import { z } from 'zod';
import { environmentSchema } from './environmentSchema';

// Project creation schema
export const projectCreationSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  code: z.string().min(3, "Code must be at least 3 characters").max(10),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  version: z.string().min(1, 'Version is required'),
  website_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  environments: z.array(environmentSchema).optional(),
});

export type ProjectCreationFormValues = z.infer<typeof projectCreationSchema>;

// Project update schema
export const projectUpdateSchema = z.object({
  id: z.number(),
  project_owner_id: z.number(),
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  code: z.string().min(3, "Code must be at least 3 characters").max(10),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  version: z.string().min(1, 'Version is required'),
  website_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  github_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  parent_project_id: z.union([z.string(), z.number()]).optional(),
  environments: z.array(environmentSchema).optional(), 
});

export type ProjectUpdateFormValues = z.infer<typeof projectUpdateSchema>; 