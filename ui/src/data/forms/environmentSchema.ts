import {z} from "zod";

export const environmentSchema = z.object({
  name: z.string().min(3, "Environment name must be at least 3 characters"),
  description: z.string().optional(),
  base_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export type EnvironmentFormValues = z.infer<typeof environmentSchema>;