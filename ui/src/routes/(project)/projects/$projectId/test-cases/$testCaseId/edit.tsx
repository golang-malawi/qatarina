import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Alert, Box, Heading, Spinner, Text } from "@chakra-ui/react";
import { useState, useEffect, useMemo } from "react";
import { z } from "zod";
import { DynamicForm, FieldConfig } from "@/components/form";
import SelectRunner from "@/components/form/SelectRunner";
import { validateTestCaseScript } from "@/services/TestCaseService";
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
    const [attachedScriptFile, setAttachedScriptFile] = useState<File | null>(null);
    const [selectedRunner, setSelectedRunner] = useState("basi");
    const [scriptValidationStatus, setScriptValidationStatus] = useState<"idle" | "validating" | "success" | "failed">("idle");
    const [scriptValidationMessage, setScriptValidationMessage] = useState<string>("");
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



const handleSubmit = async (values: z.infer<typeof schema>) => {
    setSubmitting(true);
    try {
      let body:any;
      if (values.script_file) {
        const formData = new FormData();
        formData.append("project_id", projectId);
        formData.append("id", values.id);
        formData.append("kind", values.kind ?? "");
        formData.append("code", values.code ?? "");
        formData.append("feature_or_module", values.feature_or_module ?? "");
        formData.append("title", values.title ?? "");
        formData.append("description", values.description ?? "");
        formData.append("is_draft", (values.is_draft ?? false).toString());
        if (values.tags && values.tags.length) {
        (values.tags as any[]).forEach((tag) => formData.append("tags", tag));
      }
        formData.append("script_file", values.script_file as any);
        formData.append("runner", values.runner ?? "");
        body = formData;
      } else {
        body = {
          project_id: Number(projectId),
          id: values.id,
          kind: values.kind,
          code: values.code ?? "",
          feature_or_module: values.feature_or_module ?? "",
          title: values.title,
          description: values.description,
          is_draft: values.is_draft ?? false,
          ...(values.tags && values.tags.length ? { tags: values.tags.map(t => t.value) } : {}),
          runner: values.runner,
        };
      }
      await updateMutation.mutateAsync({
        params: { path: { testCaseID: values.id } },
        body,
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
          tags: (data.tags ?? []).map((t: string) => ({ value: t })),
        }}
        onSubmit={handleSubmit}
        submitText="Update Test Case"
        submitLoading={submitting}
      />
    </Box>
  );
}