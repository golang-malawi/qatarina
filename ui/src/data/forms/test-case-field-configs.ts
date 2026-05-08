import { FieldConfig } from "@/components/form/DynamicForm";

export const createTestCaseFields = (): FieldConfig[] => [
  {
    name: "title",
    label: "Title",
    type: "text",
    placeholder: "Enter test case title",
    helperText: "Test Case Title.",
    required: true,
  },
  {
    name: "code",
    label: "Code",
    type: "text",
    placeholder: "Enter test case code",
    helperText: "Leave blank to auto-generate based on project",
    required: false,
  },
  {
    name: "feature_or_module",
    label: "Feature, Component or Module",
    type: "feature-module",
    helperText: "Test Case Feature or Module.",
    required: true,
  },
  {
    name: "kind",
    label: "Test Kind",
    type: "test-kind",
    helperText: "Test Kind.",
    required: true,
  },
  {
    name: "description",
    label: "Description",
    type: "markdown-textarea",
    placeholder: "Enter steps/procedures (Markdown supported)",
    helperText: "You can format this description using Markdown (e.g. lists, bold, headings).",
    required: true,
  },
  {
    name: "script_file",
    label: "Attach Basi/Playwright Script",
    type: "file",
    accept: ".basi, .yaml, yml",
    helperText: "Upload a Basi/Playwright script file for this test case"
  },
  {
    name: "tags",
    label: "Tags",
    type: "text",
    placeholder: "tag1, tag2, tag3",
    helperText: "Test Case tags, separated by comma.",
  },
  {
    name: "is_draft",
    label: "Is Draft",
    type: "checkbox",
    helperText: "Mark this test case as a draft",
  }
];
