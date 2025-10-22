import { z } from "zod";

export const featureModuleCreationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  description: z.string().optional(),
  code: z.string().min(1, "Code is required"),
  priority: z.coerce.number().min(1, "Priority must be at least 1"),
});

export const featureModuleEditSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  description: z.string().optional(),
  code: z.string().min(1, "Code is required"),
  priority: z.coerce.number().min(1, "Priority must be at least 1"),
});

export type FeatureModuleCreationFormData = z.infer<typeof featureModuleCreationSchema>;
export type FeatureModuleEditFormData = z.infer<typeof featureModuleEditSchema>;
