import { Alert, Box, Heading, Spinner, Text } from "@chakra-ui/react";
import { useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { validateTestCaseScript, useCreateTestCaseMutation } from "@/services/TestCaseService";
import { useProjectTestCaseTemplateQuery } from "@/services/ProjectService";
import { toaster } from "@/components/ui/toaster";
import { DynamicForm, FieldConfig } from "@/components/form/DynamicForm";
import SelectRunner from "@/components/form/SelectRunner";

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
  const redirect = useNavigate();
  const project_id = params.projectId;
  const createTestCaseMutation = useCreateTestCaseMutation();
  const { data, isLoading } = useProjectTestCaseTemplateQuery(Number(project_id));

  const [attachedScriptFile, setAttachedScriptFile] = useState<File | null>(null);
  const [selectedRunner, setSelectedRunner] = useState("basi");
  const [scriptValidationStatus, setScriptValidationStatus] = useState<"idle" | "validating" | "success" | "failed">("idle");
  const [scriptValidationMessage, setScriptValidationMessage] = useState<string>("");

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

  const fields = useMemo<FieldConfig[]>(
    () =>
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
                        <Alert.Description>
                          {scriptValidationMessage}
                        </Alert.Description>
                      </Alert.Content>
                    </Alert.Root>
                  )}
                </Box>
              </Box>
            ),
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
    [scriptValidationStatus, scriptValidationMessage, selectedRunner, params.projectId],
  );

  async function handleSubmit(values: TestCaseCreationFormData) {
    const tags =
      typeof values.tags === "string"
        ? values.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : values.tags || [];

    if (values.script_file && scriptValidationStatus !== "success") {
      toaster.create({
        title: "Script validation required",
        description:
          "Please wait for script scanning to complete and pass before creating the test case.",
        type: "warning",
        duration: 4000,
      });
      return;
    }

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

      formData.append("runner", values.runner);

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
          description: data?.test_case_template ?? "",
          runner: "basi",
          tags: [],
          is_draft: false,
        }}
      />
    </Box>
  );
}

export default NewTestCases;
