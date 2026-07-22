import { Alert, Box, Heading, Spinner, Text, Button } from "@chakra-ui/react";
import { useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";

import { validateTestCaseScript, useCreateTestCaseMutation } from "@/services/TestCaseService";
import { useProjectQuery, useProjectTestCaseTemplateQuery } from "@/services/ProjectService";
import { toaster } from "@/components/ui/toaster";
import { DynamicForm, FieldConfig } from "@/components/form/DynamicForm";
import { RunnerFieldSync } from "@/components/form/RunnerFieldSync";
import SelectFeatureModule from "@/components/form/SelectFeatureModule";

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
  const navigate = useNavigate();
  const project_id = params.projectId;

  const createTestCaseMutation = useCreateTestCaseMutation();

  const { data: templateData, isLoading } = useProjectTestCaseTemplateQuery(Number(project_id));
  const { data: projectData } = useProjectQuery(project_id);

  const [attachedScriptFile, setAttachedScriptFile] = useState<File | null>(null);
  const formValuesRef = useRef<Record<string, any>>({ runner: "basi" });

  const [scriptValidationStatus, setScriptValidationStatus] = useState<"idle" | "validating" | "success" | "failed">("idle");
  const [scriptValidationMessage, setScriptValidationMessage] = useState<string>("");

  const handleRunnerChange = (runner: string) => {
    formValuesRef.current.runner = runner;
  };

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

  const fields = useMemo<FieldConfig[]>(
    () =>
      createTestCaseFields().map((field) => {
        // If automated testing is disabled, group and display a clean banner for both runner/script fields once
        if ((field.name === "runner" || field.name === "script_file") && !projectData?.automated_testing_enabled) {
          // Render the banner only on the "runner" field to prevent duplication, and hide the "script_file" field slot entirely
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
                        params: { projectId: project_id },
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
                value={(value as string) || ""}
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
                          <Alert.Description>{scriptValidationMessage}</Alert.Description>
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
            customComponent: ({ value, onChange }: { value: any; onChange: (val: string) => void }) => (
              <SelectFeatureModule
                projectId={params.projectId}
                value={(value as string) || ""}
                onChange={onChange}
              />
            ),
          };
        }

        return field;
      }),
    [scriptValidationStatus, scriptValidationMessage, params.projectId, projectData?.automated_testing_enabled, navigate, project_id],
  );

  async function handleSubmit(values: TestCaseCreationFormData) {
    const tags =
      typeof values.tags === "string"
        ? values.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : values.tags || [];

    if (!projectData?.automated_testing_enabled && values.script_file) {
      toaster.create({
        title: "Automated testing disabled",
        description: "You cannot attach scripts because automated testing is disabled for this project.",
        type: "error",
      });
      return;
    }

    if (values.script_file && scriptValidationStatus !== "success") {
      toaster.create({
        title: "Script validation required",
        description: "Please wait for script scanning to complete and pass before creating the test case.",
        type: "warning",
        duration: 4000,
      });
      return;
    }

    let body: any;
    if (values.script_file) {
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
      formData.append("runner", values.runner);
      body = formData;
    } else {
      body = {
        project_id: Number(project_id),
        kind: values.kind,
        code: values.code,
        feature_or_module: values.feature_or_module,
        title: values.title,
        description: values.description,
        is_draft: values.is_draft ?? false,
        tags,
        runner: values.runner,
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
        navigate({
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
        fields={fields}
        onSubmit={handleSubmit}
        submitText="Create Test Case"
        submitLoading={createTestCaseMutation.isPending}
        submitDisabled={
          attachedScriptFile !== null && scriptValidationStatus !== "success"
        }
        layout="vertical"
        spacing={4}
        defaultValues={{
          title: "",
          code: "",
          feature_or_module: "",
          kind: "",
          description: templateData?.test_case_template ?? "",
          runner: "basi",
          tags: [],
          is_draft: false,
        }}
      />
    </Box>
  );
}

export default NewTestCases;