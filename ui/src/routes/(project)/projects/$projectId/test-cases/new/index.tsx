import { Alert, Box, Heading, Spinner, Text, Button } from "@chakra-ui/react";
import { useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
    setScriptValidationMessage(t("test_cases.script.scanning"));
    try {
      const result = await validateTestCaseScript(file, runner);
      setScriptValidationStatus("success");
      const message = result.output || t("test_cases.script.validated_success", { runner });
      setScriptValidationMessage(message);
    } catch (error) {
      setScriptValidationStatus("failed");
      setScriptValidationMessage((error as Error).message || t("test_cases.script.validation_failed"));
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
      setScriptValidationMessage(t("test_cases.script.select_runner_warning"));
      return;
    }
    validateAttachedScript(attachedScriptFile);
  }, [attachedScriptFile]);

  const fields = useMemo<FieldConfig[]>(
    () =>
      createTestCaseFields().map((field) => {
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
                  <Alert.Title fontWeight="semibold" mb={1}>
                    {t("test_cases.automated_testing.disabled_title")}
                  </Alert.Title>
                  <Alert.Description fontSize="sm" mb={3}>
                    {t("test_cases.automated_testing.disabled_description")}
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
                    {t("test_cases.automated_testing.go_to_settings")}
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
                            {scriptValidationMessage || t("test_cases.script.default_success")}
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
    [scriptValidationStatus, scriptValidationMessage, params.projectId, projectData?.automated_testing_enabled, navigate, project_id, t],
  );

  async function handleSubmit(values: TestCaseCreationFormData) {
    const tags =
      typeof values.tags === "string"
        ? values.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : values.tags || [];

    if (!projectData?.automated_testing_enabled && values.script_file) {
      toaster.create({
        title: t("test_cases.toast.disabled_title"),
        description: t("test_cases.toast.disabled_desc"),
        type: "error",
      });
      return;
    }

    if (values.script_file && scriptValidationStatus !== "success") {
      toaster.create({
        title: t("test_cases.toast.validation_required_title"),
        description: t("test_cases.toast.validation_required_desc"),
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
          title: t("test_cases.toast.success_title"),
          description: t("test_cases.toast.success_desc"),
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
        title: t("test_cases.toast.error_title"),
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
        <Text mt={4}>{t("test_cases.create.loading_template")}</Text>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Heading size="3xl" color="fg.heading">
        {t("test_cases.create.title")}
      </Heading>

      <DynamicForm
        schema={testCaseCreationSchema}
        fields={fields}
        onSubmit={handleSubmit}
        submitText={t("test_cases.create.submit")}
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