import {z} from 'zod';

export const orgSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters long"),
  address: z.string().optional(),
  country: z.string().optional(),
  github_url: z.string().url("Invalid URL format").optional(),
  website_url: z.string().url("Invalid URL format").optional(),
});

export type OrgFormValues = z.infer<typeof orgSchema>;