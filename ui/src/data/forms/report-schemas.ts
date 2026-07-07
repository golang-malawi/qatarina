import { z } from "zod";

export const reportCreationSchema = z.object({
  test_plan_id: z.string().min(1, "Test plan is required"),
  name: z.string().min(3, "Report name is required"),
  type: z.enum(["Summary", "Detailed", "Analytics"]),
  status: z.enum(["In Progress", "Completed", "Failed"]),
});

export type ReportCreationFormData = z.infer<typeof reportCreationSchema>;