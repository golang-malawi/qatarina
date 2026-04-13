import { FieldConfig } from "@/components/form/DynamicForm";

export const featureModuleCreationFields: FieldConfig[] = [
  {
    name: "name",
    label: "Name",
    type: "text",
    placeholder: "e.g., Login Module",
    helperText: "Feature/Module name",
    required: true,
  },
  {
    name: "type",
    label: "Type",
    type: "feature-module-type",
    helperText: "Select the type of module",
    required: true,
  },
  {
    name: "description",
    label: "Description",
    type: "text",
    placeholder: "Short description",
    helperText: "Summary of the feature/module",
  },
  {
    name: "code",
    label: "Code",
    type: "text",
    placeholder: "e.g., AUTH01",
    helperText: "Unique identifier code",
    required: true,
  },
  {
    name: "priority",
    label: "Priority",
    type: "number",
    placeholder: "e.g., 1 for highest priority",
    helperText: "Priority level (1 = high)",
    required: true,
  },
];

export const featureModuleEditFields = featureModuleCreationFields;
