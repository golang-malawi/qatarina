import { z } from 'zod';

// User creation schema
export const userCreationSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  // Optional: falls back to "First Last" when left blank.
  display_name: z
    .string()
    .trim()
    .max(100, 'Display name must be at most 100 characters')
    .optional(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type UserCreationFormValues = z.infer<typeof userCreationSchema>;

// User update schema
export const userUpdateSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

export type UserUpdateFormValues = z.infer<typeof userUpdateSchema>; 