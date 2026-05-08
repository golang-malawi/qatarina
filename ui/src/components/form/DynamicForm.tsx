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
  Heading,
  Text,
  Code,  
  List,  
  Tabs,
} from "@chakra-ui/react";
import SelectTestKind from "./SelectTestKind";
import SelectFeatureModuleType from "./SelectFeatureModuleType";
import ReactMarkdown from "react-markdown";

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
  fields?: FieldConfig[]; // for array type
  accept?: string;
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
                  {((field.state.value as any[]) || []).map((_, index) => (
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
                                <Field.Label fontWeight="semibold">
                                  {subField.label}
                                </Field.Label>
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
                                  <Field.HelperText>
                                    {subField.helperText}
                                  </Field.HelperText>
                                )}
                                {subErrors && (
                                  <Field.ErrorText>
                                    {sub.state.meta
                                      .errors!.map((error) =>
                                        typeof error === "string"
                                          ? error
                                          : ((error as any)?.message ??
                                            "Validation error"),
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
                            ...((field.state.value as any[]) || []),
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
                      const newVal = [...((field.state.value as any[]) || [])];
                      newVal.push({}); // add new empty item
                      field.handleChange(newVal);
                    }}
                  >
                    + Add {label}
                  </Button>
                </VStack>
                {helperText && (
                  <Field.HelperText>{helperText}</Field.HelperText>
                )}
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
                        <ReactMarkdown
                          components={{
                            h1: (props) => <Heading size="lg" {...props} />,
                            h2: (props) => <Heading size="md" {...props} />,
                            h3: (props) => <Heading size="sm" {...props} />,
                            p: (props) => <Text mb={2} {...props} />,
                            code: (props) => <Code colorScheme="yellow" {...props} />,
                            ul: (props) => (
                              <List.Root variant="marker" pl={4} {...props} />
                            ),
                            ol: (props) => (
                              <List.Root variant="marker" as="ol" pl={4} {...props} />
                            ),
                            li: (props) => <List.Item {...props} />,
                          }}
                        >
                          {(field.state.value as string) || ""}
                      </ReactMarkdown>
                      </Box>
                    </Tabs.Content>
                  </Tabs.Root>                          
                  </Box>
                )}

              {type === "select" && (
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={(field.state.value as string) || ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={placeholder || "Select an option"}
                  >
                    {options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              )}

              {type === "checkbox" && (
                <label
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
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

              {type === "file" &&(
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
                  {field.state.meta
                    .errors!.map((error) =>
                      typeof error === "string"
                        ? error
                        : ((error as any)?.message ?? "Validation error"),
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
          colorPalette="brand"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {submitText}
        </Button>
      </VStack>
    </form>
  );
}
