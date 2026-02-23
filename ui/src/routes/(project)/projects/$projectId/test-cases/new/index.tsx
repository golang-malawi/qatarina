import { Box, Heading } from "@chakra-ui/react";
import { useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { useCreateTestCaseMutation } from "@/services/TestCaseService";
import { toaster } from "@/components/ui/toaster";
import { DynamicForm } from "@/components/form/DynamicForm";
import { testCaseCreationSchema, TestCaseCreationFormData } from "@/data/forms/test-case-schemas";
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

  async function handleSubmit(values: TestCaseCreationFormData) {
    // Handle tags - if it's a string, split it, otherwise use as is
    const tags = typeof values.tags === 'string'
      ? values.tags.split(',').map(t => t.trim()).filter(Boolean)
      : values.tags || [];

    const res = await createTestCaseMutation.mutateAsync({
      body: {
        project_id: parseInt(`${project_id}`),
        kind: values.kind,
        code: values.code,
        feature_or_module: values.feature_or_module,
        title: values.title,
        description: values.description,
        is_draft: values.is_draft ?? false,
        tags,
      },
    });

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
  }

  return (
    <Box p={6}>
      <Heading size="3xl" color="fg.heading">
        Create Test Cases
      </Heading>
      <DynamicForm
        schema={testCaseCreationSchema}
        fields={createTestCaseFields(project_id)}
        onSubmit={handleSubmit}
        submitText="Create Test Case"
        submitLoading={createTestCaseMutation.isPending}
        layout="vertical"
        spacing={4}
      />
    </Box>
  );
}
