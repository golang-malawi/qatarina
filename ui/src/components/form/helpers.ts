import { FieldConfig, FieldType } from "./DynamicForm";

// Helper function to create field configurations
export function createFieldConfig(
  name: string,
  label: string,
  type: FieldType,
  options?: Partial<FieldConfig>
): FieldConfig {
  return {
    name,
    label,
    type,
    ...options,
  };
}

// Helper function to create select options
export function createSelectOptions(
  options: Array<{ value: string; label: string }>
) {
  return options;
}
