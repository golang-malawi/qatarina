import { createFieldConfig, FieldConfig } from '@/components/DynamicForm';

// Project creation fields
export const projectCreationFields: FieldConfig[] = [
  createFieldConfig('name', 'Project Name', 'text', {
    placeholder: 'Enter project name',
    helperText: 'Choose a descriptive name for your project',
  }),
  createFieldConfig('description', 'Description', 'textarea', {
    placeholder: 'Describe your project',
    helperText: 'Provide a detailed description of your project',
  }),
  createFieldConfig('version', 'Version', 'text', {
    placeholder: '1.0.0',
    helperText: 'Project version (e.g., 1.0.0)',
  }),
  createFieldConfig('website_url', 'Website URL', 'url', {
    placeholder: 'https://example.com',
    helperText: 'Optional: Your project website',
  }),
];

// Project update fields
export const projectUpdateFields: FieldConfig[] = [
  createFieldConfig('name', 'Project Name', 'text', {
    placeholder: 'Enter project name',
    helperText: 'Choose a descriptive name for your project',
  }),
  createFieldConfig('description', 'Description', 'textarea', {
    placeholder: 'Describe your project',
    helperText: 'Provide a detailed description of your project',
  }),
  createFieldConfig('version', 'Version', 'text', {
    placeholder: '1.0.0',
    helperText: 'Project version (e.g., 1.0.0)',
  }),
  createFieldConfig('website_url', 'Website URL', 'url', {
    placeholder: 'https://example.com',
    helperText: 'Optional: Your project website',
  }),
]; 