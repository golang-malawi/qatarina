import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Heading, Box, Spinner, Text } from "@chakra-ui/react";
import { useState } from "react";
import { z } from "zod";
import { DynamicForm, FieldConfig } from "@/components/form";
import {
  useTestCaseQuery,
  useUpdateTestCaseMutation,
} from "@/services/TestCaseService";
import { toaster } from "@/components/ui/toaster";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-cases/$testCaseId/edit"
)({
  component: EditTestCase,
});

function EditTestCase() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { projectId, testCaseId } = Route.useParams();
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading, error } = useTestCaseQuery(testCaseId);
  const updateMutation = useUpdateTestCaseMutation();

  if (isLoading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="xl" color="brand.solid" />
      </Box>
    );
  }
  if (error) return <Text color="fg.error">Error loading test case</Text>;
  if (!data) return <Text color="fg.muted">No test case found</Text>;

  const schema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1, "Title is required"),
    code: z.string().optional(),
    description: z.string().optional(),
    kind: z.string().min(1, "Kind is required"),
    feature_or_module: z.string().optional(),
    is_draft: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
  });

  const fields: FieldConfig[] = [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "code", label: "Code", type: "text" },
    { name: "description", label: "Description", type: "textarea" },
    { name: "kind", label: "Kind", type: "test-kind", required: true },
    { name: "feature_or_module", label: "Feature/Module", type: "feature-module" },
    { name: "is_draft", label: "Draft?", type: "checkbox" },
    {
      name: "tags",
      label: "Tags",
      type: "array",
      fields: [{ name: "value", label: "Tag", type: "text" }],
    },
  ];

  const handleSubmit = async (values: z.infer<typeof schema>) => {
    setSubmitting(true);
    try {
      await updateMutation.mutateAsync({
        params: { path: { testCaseID: values.id } },
        body: {
          ...values,
          code: values.code ?? "",
          description: values.description ?? "",
          feature_or_module: values.feature_or_module ?? "",
          title: values.title ?? "",
          kind: values.kind ?? "",
          is_draft: values.is_draft ?? false,
          tags: values.tags ?? [],
        },
      });

      queryClient.invalidateQueries({
        queryKey: ["get", "/v1/projects/{projectID}/test-cases"],
      });

      toaster.success({ title: "Test case updated successfully" });

      navigate({
        to: "/projects/$projectId/test-cases",
        params: { projectId},
      });
    } catch (err: any) {
      toaster.error({
        title: "Failed to update test case",
        description: err?.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box p={6}>
      <Heading size="lg" mb={4}>
        Edit Test Case
      </Heading>
      <DynamicForm
        schema={schema}
        fields={fields}
        defaultValues={{
          id: data.id ?? "",
          title: data.title ?? "",
          code: data.code ?? "",
          description: data.description ?? "",
          kind: data.kind ?? "",
          feature_or_module: data.feature_or_module ?? "",
          is_draft: data.is_draft ?? false,
          tags: data.tags ?? [],
        }}
        onSubmit={handleSubmit}
        submitText="Update Test Case"
        submitLoading={submitting}
      />
    </Box>
  );
}