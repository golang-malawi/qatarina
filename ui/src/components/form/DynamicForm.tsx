import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { ReactNode, ChangeEvent, lazy, Suspense, useRef } from "react";
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
  IconButton,
} from "@chakra-ui/react";
import SelectTestKind from "./SelectTestKind";
import SelectFeatureModuleType from "./SelectFeatureModuleType";
import SelectRunner from "./SelectRunner";
import {
  LuChevronDown,
  LuBold,
  LuItalic,
  LuHeading,
  LuQuote,
  LuCode,
  LuLink,
  LuList,
  LuListOrdered,
  LuSquareCheck,
} from "react-icons/lu";

// Import CSS stylesheet for markdown preview styling
import "@uiw/react-markdown-preview/markdown.css";

// Lazy load Markdown preview component
const MDMarkdown = lazy(() => import("@uiw/react-markdown-preview"));

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
    formValues?: Record<string, any>;
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

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isSubmitting = submitLoading ?? form.state.isSubmitting;

  // Multi-line aware Markdown formatting helper
  const applyMarkdown = (
    fieldChange: (val: string) => void,
    action:
      | "heading"
      | "bold"
      | "italic"
      | "quote"
      | "code"
      | "link"
      | "list"
      | "ordered-list"
      | "task"
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;
    const selectedText = val.substring(start, end);

    let replacement = "";
    let offsetStart = 0;
    let offsetEnd = 0;

    switch (action) {
      case "bold": {
        const text = selectedText || "bold text";
        replacement = `**${text}**`;
        offsetStart = 2;
        offsetEnd = 2 + text.length;
        break;
      }
      case "italic": {
        const text = selectedText || "italic text";
        replacement = `*${text}*`;
        offsetStart = 1;
        offsetEnd = 1 + text.length;
        break;
      }
      case "code": {
        if (selectedText.includes("\n")) {
          // Multiline selection -> Code Block
          replacement = `\n\`\`\`\n${selectedText}\n\`\`\`\n`;
          offsetStart = 5;
          offsetEnd = 5 + selectedText.length;
        } else {
          const text = selectedText || "code";
          replacement = `\`${text}\``;
          offsetStart = 1;
          offsetEnd = 1 + text.length;
        }
        break;
      }
      case "link": {
        const text = selectedText || "link text";
        replacement = `[${text}](https://)`;
        offsetStart = 1;
        offsetEnd = 1 + text.length;
        break;
      }
      case "heading": {
        const lines = (selectedText || "Heading").split("\n");
        replacement = lines.map((line) => `### ${line}`).join("\n");
        offsetStart = 4;
        offsetEnd = replacement.length;
        break;
      }
      case "quote": {
        const lines = (selectedText || "quote text").split("\n");
        replacement = lines.map((line) => `> ${line}`).join("\n");
        offsetStart = 2;
        offsetEnd = replacement.length;
        break;
      }
      case "list": {
        const lines = (selectedText || "list item").split("\n");
        replacement = lines.map((line) => `- ${line}`).join("\n");
        offsetStart = 2;
        offsetEnd = replacement.length;
        break;
      }
      case "ordered-list": {
        const lines = (selectedText || "list item").split("\n");
        replacement = lines.map((line, idx) => `${idx + 1}. ${line}`).join("\n");
        offsetStart = 3;
        offsetEnd = replacement.length;
        break;
      }
      case "task": {
        const lines = (selectedText || "task item").split("\n");
        replacement = lines.map((line) => `- [ ] ${line}`).join("\n");
        offsetStart = 6;
        offsetEnd = replacement.length;
        break;
      }
    }

    const newValue = val.substring(0, start) + replacement + val.substring(end);
    fieldChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + offsetStart, start + offsetEnd);
    }, 0);
  };

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
              <Field.Label fontSize="sm" fontWeight="medium">
                {label}
              </Field.Label>

              {type === "test-kind" && (
                <SelectTestKind
                  value={(field.state.value as string) || ""}
                  onChange={(val) => field.handleChange(val)}
                />
              )}

              {type === "feature-module" && (
                <SelectFeatureModuleType
                  value={(field.state.value as string) || ""}
                  onChange={(val) => field.handleChange(val)}
                />
              )}

              {type === "feature-module-type" && (
                <SelectFeatureModuleType
                  value={(field.state.value as string) || ""}
                  onChange={(val) => field.handleChange(val)}
                />
              )}

              {type === "runner" && (
                <SelectRunner
                  value={(field.state.value as string) || ""}
                  onChange={(val) => field.handleChange(val)}
                />
              )}

              {type === "custom" && customComponent && (
                <>
                  {customComponent({
                    value: field.state.value,
                    onChange: field.handleChange,
                    onBlur: field.handleBlur,
                    formValues: form.state.values,
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

              {/* GitHub-style Tabbed Markdown Field */}
              {type === "markdown-textarea" && (
                <Box w="100%" borderWidth="1px" borderRadius="md" p={2} bg="bg.panel">
                  <Tabs.Root defaultValue="write" variant="outline">
                    <HStack justify="space-between" align="center" flexWrap="wrap" pb={2}>
                      <Tabs.List>
                        <Tabs.Trigger value="write">Write</Tabs.Trigger>
                        <Tabs.Trigger value="preview">Preview</Tabs.Trigger>
                      </Tabs.List>

                      {/* Formatting Toolbar */}
                      <HStack gap={1} flexWrap="wrap">
                        <IconButton
                          aria-label="Heading"
                          size="xs"
                          variant="ghost"
                          onClick={() => applyMarkdown((v) => field.handleChange(v), "heading")}
                        >
                          <LuHeading />
                        </IconButton>
                        <IconButton
                          aria-label="Bold"
                          size="xs"
                          variant="ghost"
                          onClick={() => applyMarkdown((v) => field.handleChange(v), "bold")}
                        >
                          <LuBold />
                        </IconButton>
                        <IconButton
                          aria-label="Italic"
                          size="xs"
                          variant="ghost"
                          onClick={() => applyMarkdown((v) => field.handleChange(v), "italic")}
                        >
                          <LuItalic />
                        </IconButton>
                        <IconButton
                          aria-label="Quote"
                          size="xs"
                          variant="ghost"
                          onClick={() => applyMarkdown((v) => field.handleChange(v), "quote")}
                        >
                          <LuQuote />
                        </IconButton>
                        <IconButton
                          aria-label="Code"
                          size="xs"
                          variant="ghost"
                          onClick={() => applyMarkdown((v) => field.handleChange(v), "code")}
                        >
                          <LuCode />
                        </IconButton>
                        <IconButton
                          aria-label="Link"
                          size="xs"
                          variant="ghost"
                          onClick={() => applyMarkdown((v) => field.handleChange(v), "link")}
                        >
                          <LuLink />
                        </IconButton>
                        <IconButton
                          aria-label="Unordered List"
                          size="xs"
                          variant="ghost"
                          onClick={() => applyMarkdown((v) => field.handleChange(v), "list")}
                        >
                          <LuList />
                        </IconButton>
                        <IconButton
                          aria-label="Ordered List"
                          size="xs"
                          variant="ghost"
                          onClick={() => applyMarkdown((v) => field.handleChange(v), "ordered-list")}
                        >
                          <LuListOrdered />
                        </IconButton>
                        <IconButton
                          aria-label="Task List"
                          size="xs"
                          variant="ghost"
                          onClick={() => applyMarkdown((v) => field.handleChange(v), "task")}
                        >
                          <LuSquareCheck />
                        </IconButton>
                      </HStack>
                    </HStack>

                    <Tabs.Content value="write" pt={1}>
                      <Textarea
                        ref={textareaRef}
                        value={(field.state.value as string) || ""}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder={placeholder || "Write description using Markdown..."}
                        minH="200px"
                      />
                    </Tabs.Content>

                    <Tabs.Content value="preview" pt={1}>
                      <Box
                        p={3}
                        minH="200px"
                        data-color-mode="auto"
                        css={{
                          "& .wmde-markdown": {
                            background: "transparent !important",
                            lineHeight: "1.4 !important",
                          },
                          "& .wmde-markdown p": {
                            marginTop: "0.2rem !important",
                            marginBottom: "0.2rem !important",
                            whiteSpace: "pre-wrap !important",
                          },
                          "& .wmde-markdown ol, & .wmde-markdown ul": {
                            listStyleType: "decimal !important",
                            paddingLeft: "1.5rem !important",
                            marginTop: "0.25rem !important",
                            marginBottom: "0.25rem !important",
                          },
                          "& .wmde-markdown ul": {
                            listStyleType: "disc !important",
                          },
                          "& .wmde-markdown ul.contains-task-list": {
                            listStyleType: "none !important",
                            paddingLeft: "0.75rem !important",
                            marginLeft: "0 !important",
                          },
                          "& .wmde-markdown li": {
                            display: "list-item !important",
                            marginTop: "0.1rem !important",
                            marginBottom: "0.1rem !important",
                            whiteSpace: "pre-wrap !important",
                          },
                          "& .wmde-markdown li.task-list-item": {
                            display: "block !important",
                            listStyleType: "none !important",
                          },
                          "& .wmde-markdown li.task-list-item input[type='checkbox']": {
                            marginRight: "0.5rem !important",
                            marginLeft: "0 !important",
                            verticalAlign: "middle !important",
                            position: "relative",
                            top: "-1px",
                          },
                          "& .wmde-markdown li > p": {
                            display: "inline !important",
                            marginTop: "0 !important",
                            marginBottom: "0 !important",
                          },
                          "& .wmde-markdown h1, & .wmde-markdown h2, & .wmde-markdown h3, & .wmde-markdown h4, & .wmde-markdown h5, & .wmde-markdown h6": {
                            marginTop: "0.5rem !important",
                            marginBottom: "0.25rem !important",
                            lineHeight: "1.2 !important",
                          },
                          "& .wmde-markdown blockquote": {
                            borderLeft: "4px solid var(--chakra-colors-border-muted, #ccc) !important",
                            paddingLeft: "1rem !important",
                            marginTop: "0.25rem !important",
                            marginBottom: "0.25rem !important",
                          },
                          "& .wmde-markdown em, & .wmde-markdown i": {
                            fontStyle: "italic !important",
                          },
                          "& .wmde-markdown strong, & .wmde-markdown b": {
                            fontWeight: "bold !important",
                          },
                        }}
                      >
                        <Suspense fallback={<div>Loading preview...</div>}>
                          <MDMarkdown
                            className="wmde-markdown"
                            source={
                              (field.state.value as string) ||
                              "*Nothing to preview*"
                            }
                          />
                        </Suspense>
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
                  {[
                    ...new Set(
                      field.state.meta.errors!.map((error) =>
                        typeof error === "string"
                          ? error
                          : (error as any)?.message ?? "Validation error"
                      )
                    ),
                  ].join(", ")}
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