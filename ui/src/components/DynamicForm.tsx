import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import {
  Box,
  Button,
  Field,
  Input,
  Textarea,
  Checkbox,
  VStack,
  HStack,
} from "@chakra-ui/react";

// Field type definitions
export type FieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "textarea"
  | "select"
  | "checkbox"
  | "url"
  | "tel";

// Field configuration interface
export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  options?: { value: string; label: string }[]; // For select fields
  validation?: z.ZodTypeAny; // Custom validation for this field
  defaultValue?: unknown;
}

// Form configuration interface
export interface FormConfig<T extends z.ZodTypeAny> {
  schema: T;
  fields: FieldConfig[];
  defaultValues?: z.infer<T>;
  onSubmit: (values: z.infer<T>) => Promise<void> | void;
  submitText?: string;
  submitLoading?: boolean;
  layout?: "vertical" | "horizontal";
  spacing?: number;
}

// Dynamic Form Component
export function DynamicForm<T extends z.ZodTypeAny>({
  schema,
  fields,
  defaultValues,
  onSubmit,
  submitText = "Submit",
  submitLoading = false,
  layout = "vertical",
  spacing = 4,
}: FormConfig<T>) {
  const form = useForm({
    defaultValues: defaultValues || {},
    validators: {
      onChange: schema,
      onSubmit: schema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value as z.infer<T>);
    },
  });

  const renderField = (fieldConfig: FieldConfig) => {
    const { name, label, type, placeholder, helperText, options } = fieldConfig;

    return (
      <form.Field key={name} name={name}>
        {(field) => (
          <Field.Root invalid={!!field.state.meta.errors}>
            <Field.Label>{label}</Field.Label>

            {type === "textarea" && (
              <Textarea
                value={(field.state.value as string) || ""}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={placeholder}
              />
            )}

            {type === "select" && (
              <select
                value={(field.state.value as string) || ""}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              >
                <option value="">{placeholder || "Select an option"}</option>
                {options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

            {type === "checkbox" && (
              <Checkbox.Root
                checked={(field.state.value as boolean) || false}
                onCheckedChange={({ checked }) => field.handleChange(checked)}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label>{label}</Checkbox.Label>
              </Checkbox.Root>
            )}

            {["text", "email", "password", "number", "url", "tel"].includes(
              type
            ) && (
              <Input
                type={type}
                value={(field.state.value as string) || ""}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={placeholder}
              />
            )}

            {helperText && <Field.HelperText>{helperText}</Field.HelperText>}
            {field.state.meta.errors && (
              <Field.ErrorText>
                {field.state.meta.errors.join(", ")}
              </Field.ErrorText>
            )}
          </Field.Root>
        )}
      </form.Field>
    );
  };

  const renderFields = () => {
    if (layout === "horizontal") {
      // Render fields in a grid layout for horizontal
      const chunks = [];
      for (let i = 0; i < fields.length; i += 2) {
        chunks.push(fields.slice(i, i + 2));
      }

      return chunks.map((chunk, index) => (
        <HStack key={index} gap={spacing} align="start">
          {chunk.map((field) => (
            <Box key={field.name} flex="1">
              {renderField(field)}
            </Box>
          ))}
        </HStack>
      ));
    }

    // Vertical layout
    return fields.map(renderField);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <VStack gap={spacing} align="stretch">
        {renderFields()}

        <Button
          type="submit"
          variant="outline"
          loading={submitLoading}
          disabled={submitLoading}
        >
          {submitText}
        </Button>
      </VStack>
    </form>
  );
}

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
