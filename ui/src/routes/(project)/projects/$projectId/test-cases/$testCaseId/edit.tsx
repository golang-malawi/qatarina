import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Alert,
  Box,
  Button,
  Heading,
  Spinner,
  Text,
  RadioGroup,
  Stack,
  CheckboxGroup,
  Checkbox,
  Fieldset,
} from "@chakra-ui/react";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { z } from "zod";
import { DynamicForm, FieldConfig } from "@/components/form";
import { RunnerFieldSync } from "@/components/form/RunnerFieldSync";
import SelectFeatureModule from "@/components/form/SelectFeatureModule";
import { testCaseCreationSchema } from "@/data/forms/test-case-schemas";
import { createTestCaseFields } from "@/data/forms/test-case-field-configs";
import { AppDialog } from "@/components/ui/app-dialog";
import { assignTestersToTestPlan, useProjectTestPlansQuery } from "@/services/TestPlanService";
import { useProjectQuery } from "@/services/ProjectService";
import {
  useTestCaseQuery,
  useUpdateTestCaseMutation,
  validateTestCaseScript,
} from "@/services/TestCaseService";
import { useTestersQuery } from "@/services/TesterService";
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
  validateSearch: (search: { isBranched?: boolean }) => search,
});

function EditTestCase() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { projectId, testCaseId } = Route.useParams();
  const search = Route.useSearch();

  const { data, isLoading, error } = useTestCaseQuery(testCaseId);
  const { data: projectData } = useProjectQuery(projectId);
  const testPlansQuery = useProjectTestPlansQuery(projectId);
  const testersQuery = useTestersQuery();
  const updateMutation = useUpdateTestCaseMutation();

  const [attachedScriptFile, setAttachedScriptFile] = useState<File | null>(null);
  const [scriptValidationStatus, setScriptValidationStatus] = useState<
    "idle" | "validating" | "success" | "failed"
  >("idle");
  const formValuesRef = useRef<Record<string, any>>({ runner: "basi" });
  const [scriptValidationMessage, setScriptValidationMessage] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Dialog & Plan Selection State
  const [showAssignPrompt, setShowAssignPrompt] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedTesters, setSelectedTesters] = useState<string[]>([]);
  const [assigningToPlan, setAssigningToPlan] = useState(false);

  // Automatically pre-select a test plan if available
  useEffect(() => {
    const plans = testPlansQuery.data?.test_plans;
    
    if (plans && plans.length > 0 && !selectedPlanId) {
      // Find a plan that contains the parent test case, or default to the first plan
      const parentPlan = plans.find((plan: any) =>
        plan.test_cases?.some((tc: any) => tc.id === data?.parent_test_case_id)
      );
      
      const targetPlanId = parentPlan?.id 
        ? parentPlan.id.toString() 
        : plans[0]?.id?.toString();

      if (targetPlanId) {
        setSelectedPlanId(targetPlanId);
      }
    }
  }, [testPlansQuery.data, data?.parent_test_case_id, selectedPlanId]);

  const handleRunnerChange = useCallback((runner: string) => {
    formValuesRef.current.runner = runner;
  }, []);

  const fields = useMemo<FieldConfig[]>(
    () =>
      createTestCaseFields().map((field) => {
        // If automated testing is disabled, hide runner and script file
        if (
          (field.name === "runner" || field.name === "script_file") &&
          !projectData?.automated_testing_enabled
        ) {
          return {
            ...field,
            hidden: true,
          };
        }

        if (field.name === "runner") {
          return {
            ...field,
            customComponent: ({
              value,
              onChange,
            }: {
              value: any;
              onChange: (val: string) => void;
            }) => (
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
            customComponent: ({
              onChange,
              formValues: fv,
            }: {
              onChange: (file: File | null) => void;
              formValues?: Record<string, any>;
            }) => {
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
    [
      projectData?.automated_testing_enabled,
      scriptValidationStatus,
      scriptValidationMessage,
      handleRunnerChange,
      projectId,
    ]
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

  const navigateToList = () => {
    navigate({ to: "/projects/$projectId/test-cases", params: { projectId } });
  };

  const handleAddToPlan = async () => {
    if (!selectedPlanId) {
      toaster.error({ title: "No test plan selected" });
      return;
    }
    if (selectedTesters.length === 0) {
      toaster.error({ title: "No testers selected" });
      return;
    }

    setAssigningToPlan(true);
    try {
      const payload = {
        project_id: Number(projectId),
        test_plan_id: Number(selectedPlanId),
        planned_tests: [
          {
            test_case_id: testCaseId,
            user_ids: selectedTesters.map((id) => Number(id)),
          },
        ],
      };

      await assignTestersToTestPlan(selectedPlanId, payload);
      toaster.success({
        title: "Added to Test Plan",
        description: "Branched test case successfully assigned to test plan.",
      });
    } catch (err: any) {
      toaster.error({
        title: "Failed to add to test plan",
        description: err?.message || "Could not assign to test plan.",
      });
    } finally {
      setAssigningToPlan(false);
      setShowAssignPrompt(false);
      navigateToList();
    }
  };

  const handleSubmit = async (values: z.infer<typeof schema>) => {
    setSubmitting(true);

    if (!projectData?.automated_testing_enabled && values.script_file) {
      toaster.create({
        title: "Automated testing disabled",
        description:
          "You cannot attach scripts because automated testing is disabled for this project.",
        type: "error",
      });
      setSubmitting(false);
      return;
    }

    const tagsArray: string[] = Array.isArray(values.tags)
      ? values.tags
      : values.tags
      ? (values.tags as any).split(",").map((t: string) => t.trim())
      : [];
    const featureOrModule =
      values.feature_or_module?.trim() || data?.feature_or_module?.trim() || "Feature";

    if (values.script_file && scriptValidationStatus !== "success") {
      toaster.error({
        title: "Script validation required",
        description: "Please wait for validation to succeed.",
      });
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

      queryClient.invalidateQueries({
        queryKey: ["get", "/v1/projects/{projectID}/test-cases"],
      });
      toaster.success({ title: "Test case updated successfully" });

      if (search.isBranched && testPlansQuery.data?.test_plans?.length) {
        setShowAssignPrompt(true);
      } else {
        navigateToList();
      }
    } catch (err: any) {
      toaster.error({
        title: "Update failed",
        description: err?.message || "Failed to update test case.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const testPlans = testPlansQuery.data?.test_plans || [];
  const testers = testersQuery.data?.testers || [];

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
        submitDisabled={attachedScriptFile !== null && scriptValidationStatus !== "success"}
        supportedRunners={projectData?.supported_runners}
      />

      {/* Dialog shown when saving a branched test case */}
      <AppDialog
        open={showAssignPrompt}
        onOpenChange={(open) => {
          if (!open) navigateToList();
        }}
        title="Assign Test Case"
        footer={
          <>
            <Button
              variant="outline"
              disabled={assigningToPlan}
              onClick={() => {
                setShowAssignPrompt(false);
                navigateToList();
              }}
            >
              Skip
            </Button>
            <Button
              colorPalette="brand"
              loading={assigningToPlan}
              onClick={handleAddToPlan}
              disabled={!selectedPlanId || selectedTesters.length === 0}
            >
              Confirm Assignment
            </Button>
          </>
        }
      >
        <Stack gap={5}>
          {/* Step 1: Select Plan */}
          <Box>
            <Text fontWeight="semibold" mb={2}>
              1. Select a Test Plan
            </Text>
            {testPlans.length > 0 ? (
              <RadioGroup.Root
                value={selectedPlanId || ""}
                onValueChange={(details) => setSelectedPlanId(details.value)}
              >
                <Stack gap={2}>
                  {testPlans.map((plan: any) => {
                    const planIdStr = plan.id?.toString() || "";
                    if (!planIdStr) return null;

                    return (
                      <RadioGroup.Item key={planIdStr} value={planIdStr}>
                        <RadioGroup.ItemHiddenInput />
                        <RadioGroup.ItemIndicator />
                        <RadioGroup.ItemText>
                          {plan.description || `Plan #${plan.id}`}
                        </RadioGroup.ItemText>
                      </RadioGroup.Item>
                    );
                  })}
                </Stack>
              </RadioGroup.Root>
            ) : (
              <Text color="fg.muted" fontSize="sm">
                No test plans found for this project.
              </Text>
            )}
          </Box>

          <Box borderBottomWidth="1px" w="full" my={2} />

          {/* Step 2: Assign Testers */}
          <Box>
            <Text fontWeight="semibold" mb={2}>
              2. Assign Testers
            </Text>
            {testers.length > 0 ? (
              <CheckboxGroup
                value={selectedTesters}
                onValueChange={(val: any) => setSelectedTesters(val.value || val)}
              >
                <Fieldset.Root>
                  <Fieldset.Legend fontSize="sm" color="fg.muted">
                    Select at least one tester
                  </Fieldset.Legend>
                  <Fieldset.Content gap={2} mt={2}>
                    {testers.map((tester: any) => (
                      <Checkbox.Root
                        key={tester.user_id}
                        value={tester.user_id.toString()}
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control />
                        <Checkbox.Label>{tester.name}</Checkbox.Label>
                      </Checkbox.Root>
                    ))}
                  </Fieldset.Content>
                </Fieldset.Root>
              </CheckboxGroup>
            ) : (
              <Text color="fg.muted" fontSize="sm">
                No testers found.
              </Text>
            )}
          </Box>
        </Stack>
      </AppDialog>
    </Box>
  );
}