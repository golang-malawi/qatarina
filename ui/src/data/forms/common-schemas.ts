import { z } from 'zod';

// Common validation patterns
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const nameSchema = z.string().min(2, 'Name must be at least 2 characters');
export const urlSchema = z.string().url('Must be a valid URL').optional().or(z.literal(''));
export const phoneSchema = z.string().optional();

// User-related schemas
export const userBasicSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
});

export const userRegistrationSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  role: z.string().min(1, 'Please select a role'),
  agreeToTerms: z.boolean().refine((val) => val === true, 'You must agree to the terms'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const userUpdateSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  role: z.string().min(1, 'Please select a role'),
});

// Project-related schemas
export const projectBasicSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

export const projectCreationSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in format x.y.z'),
  websiteUrl: urlSchema,
  githubUrl: urlSchema,
  category: z.string().min(1, 'Please select a category'),
});

// Test case schemas
export const testCaseBasicSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  priority: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: 'Please select a priority' }),
  }),
});

export const testCaseCreationSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  priority: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: 'Please select a priority' }),
  }),
  type: z.enum(['functional', 'non-functional', 'regression', 'smoke'], {
    errorMap: () => ({ message: 'Please select a test type' }),
  }),
  expectedResult: z.string().min(5, 'Expected result must be at least 5 characters'),
});

// Contact form schema
export const contactFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(20, 'Message must be at least 20 characters'),
});

// Settings form schema
export const userSettingsSchema = z.object({
  displayName: nameSchema,
  email: emailSchema,
  timezone: z.string().min(1, 'Please select a timezone'),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    sms: z.boolean(),
  }),
  theme: z.enum(['light', 'dark', 'system'], {
    errorMap: () => ({ message: 'Please select a theme' }),
  }),
});

// Export types
export type UserBasicFormValues = z.infer<typeof userBasicSchema>;
export type UserRegistrationFormValues = z.infer<typeof userRegistrationSchema>;
export type UserUpdateFormValues = z.infer<typeof userUpdateSchema>;
export type ProjectBasicFormValues = z.infer<typeof projectBasicSchema>;
export type ProjectCreationFormValues = z.infer<typeof projectCreationSchema>;
export type TestCaseBasicFormValues = z.infer<typeof testCaseBasicSchema>;
export type TestCaseCreationFormValues = z.infer<typeof testCaseCreationSchema>;
export type ContactFormValues = z.infer<typeof contactFormSchema>;
export type UserSettingsFormValues = z.infer<typeof userSettingsSchema>; 