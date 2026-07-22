import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Alert, Box, Heading, Spinner, Text, Button } from "@chakra-ui/react";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { z } from "zod";
import { DynamicForm, FieldConfig } from "@/components/form";
import { RunnerFieldSync } from "@/components/form/RunnerFieldSync";
import SelectFeatureModule from "@/components/form/SelectFeatureModule";
import { testCaseCreationSchema } from "@/data/forms/test-case-schemas";
import { createTestCaseFields } from "@/data/forms/test-case-field-configs";

import {
  useTestCaseQuery,
  useUpdateTestCaseMutation,
  validateTestCaseScript,
} from "@/services/TestCaseService";
import { useProjectQuery } from "@/services/ProjectService";
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

  const { data: projectData } = useProjectQuery(projectId);

  const [attachedScriptFile, setAttachedScriptFile] = useState<File | null>(null);
  const formValuesRef = useRef<Record<string, any>>({ runner: "basi" });
  const [scriptValidationStatus, setScriptValidationStatus] = useState<"idle" | "validating" | "success" | "failed">("idle");
  const [scriptValidationMessage, setScriptValidationMessage] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const handleRunnerChange = useCallback((runner: string) => {
    formValuesRef.current.runner = runner;
  }, []);

  const fields = useMemo<FieldConfig[]>(() =>
    createTestCaseFields().map((field) => {
      // If automated testing is disabled, group and display a clean info banner once
      if ((field.name === "runner" || field.name === "script_file") && !projectData?.automated_testing_enabled) {
        if (field.name === "script_file") {
          return {
            ...field,
            type: "custom",
            customComponent: () => null,
          };
        }

        return {
          ...field,
          type: "custom",
          customComponent: () => (
            <Alert.Root status="info" borderRadius="md" variant="subtle" p={4}>
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title fontWeight="semibold" mb={1}>Automated Testing is Disabled</Alert.Title>
                <Alert.Description fontSize="sm" mb={3}>
                  Enable automated testing in your project settings to select test runners and attach script files.
                </Alert.Description>
                <Button
                  size="sm"
                  colorPalette="blue"
                  variant="solid"
                  onClick={() =>
                    navigate({
                      to: "/projects/$projectId/settings",
                      params: { projectId },
                    })
                  }
                >
                  Go to Project Settings
                </Button>
              </Alert.Content>
            </Alert.Root>
          ),
        };
      }

      if (field.name === "runner") {
        return {
          ...field,
          customComponent: ({ value, onChange }: { value: any; onChange: (val: string) => void }) => (
            <RunnerFieldSync
              value={(value as string) || "basi"}
              onChange={onChange}
              onRunnerChange={handleRunnerChange}
            />
          ),
        };
      }
      if (field.name === "script_file") {
        return {
          ...field,
          type: "custom",
          customComponent: ({ onChange, formValues: fv }: { onChange: (file: File | null) => void; formValues?: Record<string, any> }) => {
            if (fv) {
              formValuesRef.current = fv;
            }
            return (
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
                          {scriptValidationMessage}
                        </Alert.Description>
                      </Alert.Content>
                    </Alert.Root>
                  )}
                  {scriptValidationStatus === "success" && (
                    <Alert.Root status="success" borderRadius="md">
                      <Alert.Indicator />
                      <Alert.Content>
                        <Alert.Description wordBreak="break-word">
                          {scriptValidationMessage || "Script validated successfully."}
                        </Alert.Description>
                      </Alert.Content>
                    </Alert.Root>
                  )}
                  {scriptValidationStatus === "failed" && (
                    <Alert.Root status="error" borderRadius="md">
                      <Alert.Indicator />
                      <Alert.Content>
                        <Alert.Description wordBreak="break-word" maxWidth="100%">
                          {scriptValidationMessage}
                        </Alert.Description>
                      </Alert.Content>
                    </Alert.Root>
                  )}
                </Box>
              </Box>
            );
          },
        };
      }
      if (field.name === "feature_or_module") {
        return {
          ...field,
          type: "custom",
          customComponent: ({ value, onChange }) => (
            <SelectFeatureModule
              projectId={projectId}
              value={(value as string) || ""}
              onChange={onChange}
            />
          ),
        };
      }
      return field;
    }),
    [scriptValidationStatus, scriptValidationMessage, handleRunnerChange, projectId, projectData?.automated_testing_enabled, navigate]
  );

  const validateAttachedScript = async (file: File) => {
    const runner = formValuesRef.current.runner || "basi";
    setScriptValidationStatus("validating");
    setScriptValidationMessage("Scanning script file...");
    try {
      const result = await validateTestCaseScript(file, runner);
      setScriptValidationStatus("success");
      const message = result.output || `Script validated successfully using ${runner}.`;
      setScriptValidationMessage(message);
    } catch (error) {
      setScriptValidationStatus("failed");
      setScriptValidationMessage((error as Error).message || "Script validation failed.");
    }
  };

  useEffect(() => {
    if (!attachedScriptFile) {
      setScriptValidationStatus("idle");
      setScriptValidationMessage("");
      return;
    }

    const runner = formValuesRef.current.runner;
    if (!runner) {
      setScriptValidationStatus("failed");
      setScriptValidationMessage("Please select a runner before scanning.");
      return;
    }

    validateAttachedScript(attachedScriptFile);
  }, [attachedScriptFile]);

  const { data, isLoading, error } = useTestCaseQuery(testCaseId);
  const updateMutation = useUpdateTestCaseMutation();

  useEffect(() => {
    if (data?.runner) {
      formValuesRef.current.runner = data.runner;
    }
  }, [data]);

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

    if (!projectData?.automated_testing_enabled && values.script_file) {
      toaster.create({
        title: "Automated testing disabled",
        description: "You cannot attach scripts because automated testing is disabled for this project.",
        type: "error",
      });
      setSubmitting(false);
      return;
    }

    const tagsArray: string[] = Array.isArray(values.tags)
      ? values.tags
      : (values.tags ? (values.tags as any).split(",").map((t: string) => t.trim()) : []);
    const featureOrModule = values.feature_or_module?.trim() || data?.feature_or_module?.trim() || "Feature";

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

    try {
      await updateMutation.mutateAsync({
        params: { path: { testCaseID: values.id } },
        body,
      });

      queryClient.invalidateQueries({ queryKey: ["get", "/v1/projects/{projectID}/test-cases"] });
      toaster.success({ title: "Test case updated successfully" });
      navigate({ to: "/projects/$projectId/test-cases", params: { projectId } });
    } catch (err) {
      toaster.create({
        title: "Failed to update test case",
        description: (err as Error).message,
        type: "error",
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
          runner: data.runner ?? "basi",
          script_path: data.script_path ?? "",
        }}
        onSubmit={handleSubmit}
        submitText="Update Test Case"
        submitLoading={submitting}
        submitDisabled={
          attachedScriptFile !== null && scriptValidationStatus !== "success"
        }
      />
    </Box>
  );
}