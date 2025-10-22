import { createFieldConfig, createSelectOptions, FieldConfig } from '@/components/form';

// Test plan kind options
export const testPlanKindOptions = createSelectOptions([
  { value: 'manual', label: 'Manual Testing' },
  { value: 'automated', label: 'Automated Testing' },
  { value: 'regression', label: 'Regression Testing' },
  { value: 'smoke', label: 'Smoke Testing' },
  { value: 'integration', label: 'Integration Testing' },
  { value: 'performance', label: 'Performance Testing' },
]);

// Test plan creation fields
export const testPlanCreationFields: FieldConfig[] = [
  createFieldConfig('description', 'Description', 'textarea', {
    placeholder: 'Describe the test plan',
    helperText: 'Provide a detailed description of what this test plan covers',
  }),
  createFieldConfig('kind', 'Test Plan Type', 'select', {
    placeholder: 'Select test plan type',
    helperText: 'Choose the type of testing this plan covers',
    options: testPlanKindOptions,
  }),
  createFieldConfig('start_at', 'Start Date', 'text', {
    placeholder: 'YYYY-MM-DD',
    helperText: 'When the test plan should start',
  }),
  createFieldConfig('scheduled_end_at', 'Scheduled End Date', 'text', {
    placeholder: 'YYYY-MM-DD',
    helperText: 'When the test plan is scheduled to end',
  }),
  createFieldConfig('closed_at', 'Closed Date', 'text', {
    placeholder: 'YYYY-MM-DD (optional)',
    helperText: 'When the test plan was actually closed (optional)',
  }),
];

// Test plan update fields
export const testPlanUpdateFields: FieldConfig[] = [
  createFieldConfig('description', 'Description', 'textarea', {
    placeholder: 'Describe the test plan',
    helperText: 'Provide a detailed description of what this test plan covers',
  }),
  createFieldConfig('kind', 'Test Plan Type', 'select', {
    placeholder: 'Select test plan type',
    helperText: 'Choose the type of testing this plan covers',
    options: testPlanKindOptions,
  }),
  createFieldConfig('start_at', 'Start Date', 'text', {
    placeholder: 'YYYY-MM-DD',
    helperText: 'When the test plan should start',
  }),
  createFieldConfig('scheduled_end_at', 'Scheduled End Date', 'text', {
    placeholder: 'YYYY-MM-DD',
    helperText: 'When the test plan is scheduled to end',
  }),
  createFieldConfig('closed_at', 'Closed Date', 'text', {
    placeholder: 'YYYY-MM-DD (optional)',
    helperText: 'When the test plan was actually closed (optional)',
  }),
]; 