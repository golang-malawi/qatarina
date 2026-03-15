import { createFieldConfig, FieldConfig } from '@/components/form';
import { CountryField } from "./CountryField";

export const userCreationFields: FieldConfig[] = [
  createFieldConfig('first_name', 'First Name', 'text', {
    placeholder: 'Enter first name',
    helperText: 'First name of the user',
  }),
  createFieldConfig('last_name', 'Last Name', 'text', {
    placeholder: 'Enter last name',
    helperText: 'Last name of the user',
  }),
  createFieldConfig('email', 'Email', 'email', {
    placeholder: 'Enter email address',
    helperText: 'Email of the user',
  }),
  createFieldConfig('password', 'Password', 'password', {
    placeholder: 'Enter password',
    helperText: 'Choose a password for the user',
  }),
  {
    name: "country_iso",
    label: "",
    type: "custom" as const,
    customComponent: CountryField,
  },
];

// User update fields (password is optional)
export const userUpdateFields: FieldConfig[] = [
  createFieldConfig('first_name', 'First Name', 'text', {
    placeholder: 'Enter first name',
    helperText: 'First name of the user',
  }),
  createFieldConfig('last_name', 'Last Name', 'text', {
    placeholder: 'Enter last name',
    helperText: 'Last name of the user',
  }),
  createFieldConfig('email', 'Email', 'email', {
    placeholder: 'Enter email address',
    helperText: 'Email of the user',
  }),
  createFieldConfig('password', 'Password', 'password', {
    placeholder: 'Enter new password (optional)',
    helperText: 'Leave blank to keep current password',
  }),
  {
    name: "country_iso",
    label: "",
    type: "custom" as const,
    customComponent: CountryField,
  },
]; 