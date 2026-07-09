import { FieldConfig } from "@/components/form/DynamicForm";

export function createReportFields(
  testPlans: { id: string; title: string }[]
): FieldConfig[] {
  return [
    {
      name: "test_plan_id",
      label: "Test Plan",
      type: "select",
      placeholder: "Select a test plan",
      options: testPlans.map((tp) => ({
        label: tp.title,
        value: tp.id,
      })),
    },
    {
      name: "name",
      label: "Report Name",
      type: "text",
      placeholder: "Enter report name",
    },
    {
      name: "type",
      label: "Report Type",
      type: "select",
      placeholder: "Select a report type",
      options: [
        { label: "Summary", value: "Summary" },
        { label: "Detailed", value: "Detailed" },
        { label: "Analytics", value: "Analytics" },
      ],
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      placeholder: "Select a status",
      options: [
        { label: "In Progress", value: "In Progress" },
        { label: "Completed", value: "Completed" },
        { label: "Failed", value: "Failed" },
      ],
    },
  ];
}
