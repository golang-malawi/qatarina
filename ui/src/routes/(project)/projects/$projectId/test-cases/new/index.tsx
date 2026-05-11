import { Box, Heading, Spinner, Text } from "@chakra-ui/react";
import { useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { useCreateTestCaseMutation } from "@/services/TestCaseService";
import { useProjectTestCaseTemplateQuery } from "@/services/ProjectService";
import { toaster } from "@/components/ui/toaster";
import { DynamicForm } from "@/components/form/DynamicForm";
import {
  testCaseCreationSchema,
  TestCaseCreationFormData,
} from "@/data/forms/test-case-schemas";
import { createTestCaseFields } from "@/data/forms/test-case-field-configs";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-cases/new/",
)({
  component: NewTestCases,
});

function NewTestCases() {
  const params = Route.useParams();
  const redirect = useNavigate();
  const project_id = params.projectId;
  const createTestCaseMutation = useCreateTestCaseMutation();
  const { data, isLoading } = useProjectTestCaseTemplateQuery(Number(project_id));

  async function handleSubmit(values: TestCaseCreationFormData) {
    const tags =
      typeof values.tags === "string"
        ? values.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : values.tags || [];

    let body:any;

    if (values.script_file) {
      // File present - use FormData
      const formData = new FormData();
      formData.append("project_id", project_id.toString());
      formData.append("kind", values.kind);
      formData.append("code", values.code ?? "");
      formData.append("feature_or_module", values.feature_or_module);
      formData.append("title", values.title);
      formData.append("description", values.description);
      formData.append("is_draft", (values.is_draft ?? false).toString());
      tags.forEach((tag) => formData.append("tags", tag));
      formData.append("script_file", values.script_file);

      body = formData;
    } else {
      // No file - send JSON
      body = {
        project_id: Number(project_id),
        kind: values.kind,
        code: values.code,
        feature_or_module: values.feature_or_module,
        title: values.title,
        description: values.description,
        is_draft: values.is_draft ?? false,
        tags,
      };
    }

    try {
      const res = await createTestCaseMutation.mutateAsync({ body });

      if (res) {
        toaster.create({
          title: "Test Case created.",
          description: "We've created your Test Case.",
          type: "success",
          duration: 3000,
        });
        redirect({
          to: "/projects/$projectId/test-cases",
          params: { projectId: `${project_id}` },
        });
      }
    } catch (err) {
      toaster.create({
        title: "Failed to create test case",
        description: (err as Error).message,
        type: "error",
        duration: 4000,
      });
    }
  }

  if (isLoading) {
    return (
      <Box p={6}>
        <Spinner size="lg" />
        <Text mt={4}>Loading template...</Text>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Heading size="3xl" color="fg.heading">
        Create Test Cases
      </Heading>
      <DynamicForm
        schema={testCaseCreationSchema}
        fields={createTestCaseFields()}
        onSubmit={handleSubmit}
        submitText="Create Test Case"
        submitLoading={createTestCaseMutation.isPending}
        layout="vertical"
        spacing={4}
        defaultValues={{
          title: "",
          code: "",
          feature_or_module: "Feature",
          kind: "",
          description: data?.test_case_template ?? "",
          tags: [],
          is_draft: false,
        }}
      />
    </Box>
  );
}

export default NewTestCases;
