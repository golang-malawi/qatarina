import { createFileRoute } from "@tanstack/react-router";
import { DynamicFormExamples } from "@/components/DynamicFormExample";

export const Route = createFileRoute("/ui/dynamic-form-demo/")({
  component: DynamicFormDemoPage,
});

function DynamicFormDemoPage() {
  return <DynamicFormExamples />;
} 