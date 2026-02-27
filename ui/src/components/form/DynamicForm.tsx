import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { ReactNode, ChangeEvent } from "react";
import {
  Box,
  Button,
  Input,
  Field,
  Textarea,
  VStack,
  HStack,
} from "@chakra-ui/react";
import SelectTestKind from "./SelectTestKind";
import SelectFeatureModuleType from "./SelectFeatureModuleType";

export type FieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "textarea"
  | "select"
  | "checkbox"
  | "url"
  | "tel"
  | "date"
  | "datetime-local"
  | "test-kind"
  | "feature-module"
  | "feature-module-type"
  | "custom"
  | "array";

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: z.ZodTypeAny;
  defaultValue?: unknown;
  customComponent?: (props: {
    value: unknown;
    onChange: (value: unknown) => void;
    onBlur: () => void;
  }) => ReactNode;
  fields?: FieldConfig[]; // for array type
}

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

export function DynamicForm<T extends z.ZodTypeAny>({
  schema,
  fields,
  defaultValues,
  onSubmit,
  submitText = "Submit",
  submitLoading,
  layout = "vertical",
  spacing = 4,
}: FormConfig<T>) {
  const form = useForm({
    defaultValues: defaultValues || {},
    validators: {
      onBlur: schema,
      onSubmit: schema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value as z.infer<T>);
    },
  });

  const isSubmitting = submitLoading ?? form.state.isSubmitting;

  const renderField = (fieldConfig: FieldConfig) => {
    const {
      name,
      label,
      type,
      placeholder,
      helperText,
      options,
      customComponent,
    } = fieldConfig;

    return (
      <form.Field key={name} name={name}>
        {(field) => {
          const showErrors =
            field.state.meta.isTouched &&
            field.state.meta.errors &&
            field.state.meta.errors.length > 0;

          if (type === "array" && fieldConfig.fields) {
            return (
              <Field.Root invalid={showErrors}>
                  <Field.Label fontWeight="semibold">{label}</Field.Label>
                <VStack align="stretch" gap={2}>
                  {(field.state.value as any[] || []).map((_, index) => (
                    <Box
                      key={index}
                      border="1px solid #ccc"
                      p={2}
                      borderRadius="md"
                    >
                      {fieldConfig.fields!.map((subField) => (
                        <form.Field
                          key={`${name}[${index}].${subField.name}`}
                          name={`${name}[${index}].${subField.name}`}
                        >
                          {(sub) => {
                            const subErrors =
                              sub.state.meta.isTouched &&
                              sub.state.meta.errors &&
                              sub.state.meta.errors.length > 0;

                              return (
                                <Field.Root invalid={subErrors}>
                                  <Field.Label fontWeight="semibold">{subField.label}</Field.Label>
                                  <Input
                                    type={subField.type as any}
                                    value={(sub.state.value as string) || ""}
                                    onBlur={sub.handleBlur}
                                    onChange={(e) =>
                                      sub.handleChange(e.target.value)
                                    }
                                    placeholder={subField.placeholder}
                                  />
                                  {subField.helperText && (
                                   <Field.HelperText>{subField.helperText}</Field.HelperText>
                                  )}
                                  {subErrors && (
                                    <Field.ErrorText>
                                      {sub.state.meta.errors!
                                        .map((error) =>
                                          typeof error === "string"
                                            ? error
                                            : ((error as any)?.message ??
                                                "Validation error")
                                        )
                                        .join(", ")}
                                    </Field.ErrorText>
                                  )}
                                </Field.Root>
                              );
                          }}
                        </form.Field>
                      ))}
                      <Button
                        size="sm"
                        mt={2}
                        onClick={() => {
                          const newVal = [
                            ...(field.state.value as any[] || []),
                          ];
                          newVal.splice(index, 1); // remove current item
                          field.handleChange(newVal);
                        }}
                      >
                        Remove
                      </Button>
                    </Box>
                  ))}
                  <Button
                    size="sm"
                    onClick={() => {
                      const newVal = [...(field.state.value as any[] || [])];
                      newVal.push({}); // add new empty item
                      field.handleChange(newVal);
                    }}
                  >
                    + Add {label}
                  </Button>
                </VStack>
                {helperText && <Field.HelperText>{helperText}</Field.HelperText>}                
              </Field.Root>
            );
          }

          return (
            <Field.Root invalid={showErrors}>
              <Field.Label fontWeight="semibold">{label}</Field.Label>

              {type === "test-kind" && (
                <SelectTestKind
                  value={field.state.value as string}
                  onChange={(val) => field.handleChange(val)}
                />
              )}

              {type === "feature-module" && (
                <SelectFeatureModuleType        
                  value={field.state.value as string}
                  onChange={(val) => field.handleChange(val)}
                />
              )}

              {type === "feature-module-type" && (
                <SelectFeatureModuleType
                  value={field.state.value as string}
                  onChange={(val) => field.handleChange(val)}
                />
              )}

              {type === "custom" && customComponent && (
                <>
                  {customComponent({
                    value: field.state.value,
                    onChange: field.handleChange,
                    onBlur: field.handleBlur,
                  })}
                </>
              )}

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
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    field.handleChange(e.target.value)
                  }
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
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={(field.state.value as boolean) || false}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      field.handleChange(e.target.checked)
                    }
                  />
                  <span>{label}</span>
                </label>
              )}

              {[
                "text",
                "email",
                "password",
                "number",
                "url",
                "tel",
                "date",
                "datetime-local",
              ].includes(type) && (
                <Input
                  type={type}
                  value={(field.state.value as string) || ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={placeholder}
                />
              )}

             {helperText && <Field.HelperText>{helperText}</Field.HelperText>}
              {showErrors && (
                <Field.ErrorText>
                  {field.state.meta.errors!
                    .map((error) =>
                      typeof error === "string"
                        ? error
                        : ((error as any)?.message ?? "Validation error")
                    )
                    .join(", ")}
                </Field.ErrorText>
              )}
            </Field.Root>
          );
        }}
      </form.Field>
    );
  };

  const renderFields = () => {
    if (layout === "horizontal") {
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
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {submitText}
        </Button>
      </VStack>
    </form>
  );
}