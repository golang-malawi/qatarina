import { createFieldConfig, createSelectOptions, FieldConfig } from '@/components/form';

// Common field configurations
export const commonFields = {
  firstName: createFieldConfig('firstName', 'First Name', 'text', {
    placeholder: 'Enter your first name',
    helperText: 'Your first name as it appears on official documents',
  }),
  
  lastName: createFieldConfig('lastName', 'Last Name', 'text', {
    placeholder: 'Enter your last name',
    helperText: 'Your last name as it appears on official documents',
  }),
  
  email: createFieldConfig('email', 'Email Address', 'email', {
    placeholder: 'Enter your email address',
    helperText: 'We will use this for account notifications',
  }),
  
  password: createFieldConfig('password', 'Password', 'password', {
    placeholder: 'Enter your password',
    helperText: 'Must be at least 8 characters long',
  }),
  
  confirmPassword: createFieldConfig('confirmPassword', 'Confirm Password', 'password', {
    placeholder: 'Confirm your password',
    helperText: 'Please enter the same password again',
  }),
  
  phone: createFieldConfig('phone', 'Phone Number', 'tel', {
    placeholder: 'Enter your phone number',
    helperText: 'Optional',
  }),
  
  name: createFieldConfig('name', 'Full Name', 'text', {
    placeholder: 'Enter your full name',
    helperText: 'Your name as it appears on official documents',
  }),
  
  displayName: createFieldConfig('displayName', 'Display Name', 'text', {
    placeholder: 'Enter your display name',
    helperText: 'This is how your name will appear to others',
  }),
  
  subject: createFieldConfig('subject', 'Subject', 'text', {
    placeholder: 'Enter message subject',
    helperText: 'Brief description of your message',
  }),
  
  message: createFieldConfig('message', 'Message', 'textarea', {
    placeholder: 'Enter your message',
    helperText: 'Please provide detailed information',
  }),
  
  description: createFieldConfig('description', 'Description', 'textarea', {
    placeholder: 'Enter description',
    helperText: 'Provide a detailed description',
  }),
  
  websiteUrl: createFieldConfig('websiteUrl', 'Website URL', 'url', {
    placeholder: 'https://example.com',
    helperText: 'Optional: Your website URL',
  }),
  
  githubUrl: createFieldConfig('githubUrl', 'GitHub URL', 'url', {
    placeholder: 'https://github.com/username/repo',
    helperText: 'Optional: Your GitHub repository',
  }),
  
  version: createFieldConfig('version', 'Version', 'text', {
    placeholder: '1.0.0',
    helperText: 'Use semantic versioning (e.g., 1.0.0)',
  }),
  
  title: createFieldConfig('title', 'Title', 'text', {
    placeholder: 'Enter title',
    helperText: 'A descriptive title',
  }),
  
  expectedResult: createFieldConfig('expectedResult', 'Expected Result', 'textarea', {
    placeholder: 'Describe the expected result',
    helperText: 'What should happen when this test passes?',
  }),
};

// Role options
export const roleOptions = createSelectOptions([
  { value: 'admin', label: 'Administrator' },
  { value: 'manager', label: 'Manager' },
  { value: 'tester', label: 'Tester' },
  { value: 'developer', label: 'Developer' },
  { value: 'user', label: 'User' },
]);

// Priority options
export const priorityOptions = createSelectOptions([
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]);

// Test type options
export const testTypeOptions = createSelectOptions([
  { value: 'functional', label: 'Functional' },
  { value: 'non-functional', label: 'Non-Functional' },
  { value: 'regression', label: 'Regression' },
  { value: 'smoke', label: 'Smoke' },
]);

// Category options
export const categoryOptions = createSelectOptions([
  { value: 'web', label: 'Web Application' },
  { value: 'mobile', label: 'Mobile Application' },
  { value: 'desktop', label: 'Desktop Application' },
  { value: 'api', label: 'API/Backend' },
  { value: 'other', label: 'Other' },
]);

// Theme options
export const themeOptions = createSelectOptions([
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]);

// Timezone options (common ones)
export const timezoneOptions = createSelectOptions([
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time' },
  { value: 'America/Chicago', label: 'Central Time' },
  { value: 'America/Denver', label: 'Mountain Time' },
  { value: 'America/Los_Angeles', label: 'Pacific Time' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Shanghai', label: 'Shanghai' },
  { value: 'Australia/Sydney', label: 'Sydney' },
]);

// Field configurations for specific forms
export const userRegistrationFields: FieldConfig[] = [
  commonFields.firstName,
  commonFields.lastName,
  commonFields.email,
  commonFields.password,
  commonFields.confirmPassword,
  createFieldConfig('role', 'Role', 'select', {
    placeholder: 'Select your role',
    helperText: 'Choose the role that best describes your position',
    options: roleOptions,
  }),
  createFieldConfig('agreeToTerms', 'I agree to the terms and conditions', 'checkbox', {
    helperText: 'You must agree to continue',
  }),
];

export const userUpdateFields: FieldConfig[] = [
  commonFields.firstName,
  commonFields.lastName,
  commonFields.email,
  commonFields.phone,
  createFieldConfig('role', 'Role', 'select', {
    placeholder: 'Select role',
    options: roleOptions,
  }),
];

export const projectCreationFields: FieldConfig[] = [
  createFieldConfig('name', 'Project Name', 'text', {
    placeholder: 'Enter project name',
    helperText: 'Choose a descriptive name for your project',
  }),
  commonFields.description,
  commonFields.version,
  commonFields.websiteUrl,
  commonFields.githubUrl,
  createFieldConfig('category', 'Category', 'select', {
    placeholder: 'Select a category',
    helperText: 'Choose the most appropriate category',
    options: categoryOptions,
  }),
];

export const testCaseCreationFields: FieldConfig[] = [
  commonFields.title,
  commonFields.description,
  createFieldConfig('priority', 'Priority', 'select', {
    placeholder: 'Select priority',
    helperText: 'Choose the priority level for this test case',
    options: priorityOptions,
  }),
  createFieldConfig('type', 'Test Type', 'select', {
    placeholder: 'Select test type',
    helperText: 'Choose the type of test case',
    options: testTypeOptions,
  }),
  commonFields.expectedResult,
];

export const contactFormFields: FieldConfig[] = [
  commonFields.name,
  commonFields.email,
  commonFields.phone,
  commonFields.subject,
  commonFields.message,
];

export const userSettingsFields: FieldConfig[] = [
  commonFields.displayName,
  commonFields.email,
  createFieldConfig('timezone', 'Timezone', 'select', {
    placeholder: 'Select timezone',
    helperText: 'Choose your local timezone',
    options: timezoneOptions,
  }),
  createFieldConfig('theme', 'Theme', 'select', {
    placeholder: 'Select theme',
    helperText: 'Choose your preferred theme',
    options: themeOptions,
  }),
  createFieldConfig('notifications.email', 'Email Notifications', 'checkbox', {
    helperText: 'Receive notifications via email',
  }),
  createFieldConfig('notifications.push', 'Push Notifications', 'checkbox', {
    helperText: 'Receive push notifications',
  }),
  createFieldConfig('notifications.sms', 'SMS Notifications', 'checkbox', {
    helperText: 'Receive notifications via SMS',
  }),
];

// Helper function to create custom field configurations
export function createCustomFieldConfig(
  name: string,
  label: string,
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'url' | 'tel',
  options?: Partial<FieldConfig>
): FieldConfig {
  return createFieldConfig(name, label, type, options);
}

// Helper function to create select field with custom options
export function createSelectField(
  name: string,
  label: string,
  options: Array<{ value: string; label: string }>,
  config?: Partial<FieldConfig>
): FieldConfig {
  return createFieldConfig(name, label, 'select', {
    options: createSelectOptions(options),
    ...config,
  });
} 