import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Alert, Box, Heading, Spinner, Text } from "@chakra-ui/react";
import { useState, useMemo, useEffect } from "react";
import { z } from "zod";
import { DynamicForm, FieldConfig } from "@/components/form";
import SelectRunner from "@/components/form/SelectRunner";
import { testCaseCreationSchema } from "@/data/forms/test-case-schemas";
import { createTestCaseFields } from "@/data/forms/test-case-field-configs";

import {
  useTestCaseQuery,
  useUpdateTestCaseMutation,
  validateTestCaseScript,
} from "@/services/TestCaseService";
import { toaster } from "@/components/ui/toaster";
import { useQueryClient } from "@tanstack/react-query";

const schema = testCaseCreationSchema.extend({
  id: z.string(),
  script_path: z.string().optional(),
});

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
    const [selectedRunner, setSelectedRunner] = useState("");
    const [scriptValidationStatus, setScriptValidationStatus] = useState<"idle" | "validating" | "success" | "failed">("idle");
    const [scriptValidationMessage, setScriptValidationMessage] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const fields = useMemo<FieldConfig[]>(() =>
    createTestCaseFields().map((field) => {
      if (field.name === "runner") {
        return {
          ...field,
          customComponent: ({ value, onChange }: { value: any; onChange: (val: string) => void }) => (
            <SelectRunner
              value={(value as string) || "basi"}
              onChange={(val) => {
                onChange(val);
                setSelectedRunner(val);
              }}
            />
          ),
        };
      }
      if (field.name === "script_file") {
        return {
          ...field,
          type: "custom",
          customComponent: ({ onChange }: { onChange: (file: File | null) => void }) => (
            <Box>
              <input
                type="file"
                accept=".yaml,.yml,.basi"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  onChange(file);
                  setAttachedScriptFile(file);
                }}
              />
              <Box mt={2}>
                {scriptValidationStatus === "validating" && (
                  <Alert.Root status="info" borderRadius="md">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Description>
                        Scanning script file using {selectedRunner}. Please wait...
                      </Alert.Description>
                    </Alert.Content>
                  </Alert.Root>
                )}
                {scriptValidationStatus === "success" && (
                  <Alert.Root status="success" borderRadius="md">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Description>
                        {scriptValidationMessage || "Script validated successfully."}
                      </Alert.Description>
                    </Alert.Content>
                  </Alert.Root>
                )}
                {scriptValidationStatus === "failed" && (
                  <Alert.Root status="error" borderRadius="md">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Description>{scriptValidationMessage}</Alert.Description>
                    </Alert.Content>
                  </Alert.Root>
                )}
              </Box>
            </Box>
          ),
        };
      }
      return field;
    }),
    [scriptValidationStatus, scriptValidationMessage, selectedRunner]
  );

  const validateAttachedScript = async (file: File, runner: string) => {
    setScriptValidationStatus("validating");
    setScriptValidationMessage("Scanning script file...");
    try {
      const result = await validateTestCaseScript(file, runner);
      setScriptValidationStatus("success");
      setScriptValidationMessage(result.output || "Script validated successfully.");
    } catch (error) {
      setScriptValidationStatus("failed");
      setScriptValidationMessage((error as Error).message || "Script validation failed.");
    }
  };

  useEffect(() => {
    if (attachedScriptFile) {
      validateAttachedScript(attachedScriptFile, selectedRunner);
    } else {
      setScriptValidationStatus("idle");
      setScriptValidationMessage("");
    }
  }, [attachedScriptFile, selectedRunner]);

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
    // normalize tags
    const tagsArray: string[] = Array.isArray(values.tags)
      ? values.tags
      : (values.tags ? (values.tags as any).split(",").map((t: string) => t.trim()) : []);
    const featureOrModule = values.feature_or_module?.trim() || data?.feature_or_module?.trim() || "Feature";

    // precheck script validation
    if (values.script_file && scriptValidationStatus !== "success") {
      toaster.error({ title: "Script validation required", description: "Please wait for validation to succeed." });
      setSubmitting(false);
      return;
    }

    let body: any;
    if (values.script_file) {
      const formData = new FormData();
      formData.append("project_id", projectId.toString());
      formData.append("id", values.id);
      formData.append("kind", values.kind ?? "");
      formData.append("code", values.code ?? "");
      formData.append("feature_or_module", featureOrModule);
      formData.append("title", values.title ?? "");
      formData.append("description", values.description ?? "");
      formData.append("is_draft", (values.is_draft ?? false).toString());
      tagsArray.forEach((tag) => formData.append("tags", tag));
      formData.append("script_file", values.script_file as any);
      formData.append("runner", values.runner ?? "");
      body = formData;
    } else {
      body = {
        project_id: Number(projectId),
        id: values.id,
        kind: values.kind,
        code: values.code ?? "",
        feature_or_module: featureOrModule,
        title: values.title,
        description: values.description,
        is_draft: values.is_draft ?? false,
        ...(tagsArray.length ? { tags: tagsArray } : {}),
        runner: values.runner,
        script_path: data?.script_path ?? "",
      };
    }

    await updateMutation.mutateAsync({
      params: { path: { testCaseID: values.id } },
      body,
    });

    queryClient.invalidateQueries({ queryKey: ["get", "/v1/projects/{projectID}/test-cases"] });
    toaster.success({ title: "Test case updated successfully" });
    navigate({ to: "/projects/$projectId/test-cases", params: { projectId } });
    setSubmitting(false);
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
          runner: data.runner ?? "basi",
          script_path: data.script_path ?? "",
        }}
        onSubmit={handleSubmit}
        submitText="Update Test Case"
        submitLoading={submitting}
      />
    </Box>
  );
}