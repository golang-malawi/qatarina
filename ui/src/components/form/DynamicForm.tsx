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
  NativeSelect,
  Tabs,
} from "@chakra-ui/react";

import SelectTestKind from "./SelectTestKind";
import SelectFeatureModuleType from "./SelectFeatureModuleType";
import ReactMarkdown from "react-markdown";
import SelectRunner from "./SelectRunner";
import { LuChevronDown } from "react-icons/lu";

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
  | "runner"
  | "custom"
  | "array"
  | "markdown-textarea"
  | "file";

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
  fields?: FieldConfig[];
  accept?: string;
}

export interface FormConfig<T extends z.ZodTypeAny> {
  schema: T;
  fields: FieldConfig[];
  defaultValues?: z.infer<T>;
  onSubmit: (values: z.infer<T>) => Promise<void> | void;
  submitText?: string;
  submitLoading?: boolean;
  submitDisabled?: boolean;
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
  submitDisabled,
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
    const { name, label, type, placeholder, helperText, options, customComponent } = fieldConfig;

    return (
      <form.Field key={name} name={name}>
        {(field) => {
          const showErrors =
            field.state.meta.isTouched &&
            field.state.meta.errors &&
            field.state.meta.errors.length > 0;

          return (
            <Field.Root invalid={showErrors}>
              <Field.Label fontSize="sm" fontWeight="medium">{label}</Field.Label>

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

              {type === "runner" && (
                <SelectRunner
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

              {type === "markdown-textarea" && (
                <Box w="100%">
                  <Tabs.Root defaultValue="write">
                    <Tabs.List>
                      <Tabs.Trigger value="write">Write</Tabs.Trigger>
                      <Tabs.Trigger value="preview">Preview</Tabs.Trigger>
                    </Tabs.List>
                    <Tabs.Content value="write">
                      <Textarea
                        width="100%"
                        minHeight="200px"
                        fontFamily="monospace"
                        value={(field.state.value as string) || ""}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder={placeholder}
                      />
                    </Tabs.Content>
                    <Tabs.Content value="preview">
                      <Box
                        mt={2}
                        p={4}
                        border="1px solid"
                        borderColor="gray.200"
                        bg="gray.50"
                        borderRadius="md"
                      >
                        <ReactMarkdown>{(field.state.value as string) || ""}</ReactMarkdown>
                      </Box>
                    </Tabs.Content>
                  </Tabs.Root>
                </Box>
              )}

              {type === "select" && (
                <Box position="relative">
                  <NativeSelect.Root>
                    <NativeSelect.Field
                      value={(field.state.value as string) || ""}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    >
                      <option value="">{placeholder || "Select an option"}</option>
                      {options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                  <Box
                    position="absolute"
                    right="2"
                    top="50%"
                    transform="translateY(-50%)"
                    pointerEvents="none"
                    color="fg.muted"
                  >
                    <LuChevronDown />
                  </Box>
                </Box>
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

              {type === "file" && (
                <Input
                  type="file"
                  accept={fieldConfig.accept}
                  onBlur={field.handleBlur}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0];
                    field.handleChange(file);
                  }}
                />
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
                  {[...new Set(field.state.meta.errors!.map(
                    (error) =>
                      typeof error === "string"
                        ? error
                        : (error as any)?.message ?? "Validation error"
                  ))].join(", ")}
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
          colorPalette="brand"
          loading={isSubmitting}
          disabled={isSubmitting || submitDisabled}
        >
          {submitText}
        </Button>
      </VStack>
    </form>
  );
}