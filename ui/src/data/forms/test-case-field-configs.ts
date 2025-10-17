import { FieldConfig } from "@/components/form/DynamicForm";

export const createTestCaseFields = (projectId: string): FieldConfig[] => [
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
    helperText: "Test Case Code.",
    required: true,
  },
  {
    name: "feature_or_module",
    label: "Feature, Component or Module",
    type: "feature-module",
    helperText: "Test Case Feature or Module.",
    required: true,
    projectId: projectId,
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
    type: "text",
    placeholder: "Enter description",
    helperText: "Test Case Description.",
    required: true,
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
  },
];
