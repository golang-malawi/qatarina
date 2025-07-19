import { z } from 'zod';

// Test plan creation schema
export const testPlanCreationSchema = z.object({
  kind: z.string().min(1, 'Test plan kind is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  start_at: z.string().min(1, 'Start date is required'),
  closed_at: z.string().optional(),
  scheduled_end_at: z.string().min(1, 'Scheduled end date is required'),
});

export type TestPlanCreationFormValues = z.infer<typeof testPlanCreationSchema>;

// Test plan update schema
export const testPlanUpdateSchema = z.object({
  kind: z.string().min(1, 'Test plan kind is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  start_at: z.string().min(1, 'Start date is required'),
  closed_at: z.string().optional(),
  scheduled_end_at: z.string().min(1, 'Scheduled end date is required'),
});

export type TestPlanUpdateFormValues = z.infer<typeof testPlanUpdateSchema>; 