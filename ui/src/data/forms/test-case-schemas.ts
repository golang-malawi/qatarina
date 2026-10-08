import { z } from "zod";
import { DEFAULT_PRIORITY, PRIORITY_LEVELS } from "@/common/constants/priority";

export const testCaseCreationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  code: z.string().optional(),
  feature_or_module: z.string().min(1, "Feature or module is required").default("feature"),
  kind: z.string().min(1, "Test kind is required"),
  description: z.string().min(1, "Description is required"),
  tags: z.union([z.string(), z.array(z.string())]).optional().default([]),
  is_draft: z.boolean().optional().default(false),
  script_file: z.any().optional(),
  runner: z.string().optional().default(""),
  priority: z.enum(PRIORITY_LEVELS).optional().default(DEFAULT_PRIORITY),
});

export type TestCaseCreationFormData = z.infer<typeof testCaseCreationSchema>;
