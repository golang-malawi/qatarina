import { createFileRoute } from "@tanstack/react-router";
import {
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Fieldset,
  Flex,
  For,
  Heading,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Toaster, toaster } from "@/components/ui/toaster";
import { AppDialog } from "@/components/ui/app-dialog";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SelectAssignedTestCase } from "@/common/models";
import { useCreateTestPlanMutation } from "@/services/TestPlanService";
import { useTestersQuery } from "@/services/TesterService";
import { testCasesByProjectIdQueryOptions } from "@/data/queries/test-cases";
import { DynamicForm } from "@/components/form/DynamicForm";
import {
  testPlanCreationSchema,
  TestPlanCreationFormValues,
} from "@/data/forms/test-plan-schemas";
import { testPlanCreationFields } from "@/data/forms/test-plan-field-configs";
import { findEnvironmentsByProjectQueryOptions } from "@/data/queries/environments";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-plans/new/"
)({
  loader: ({ context: { queryClient }, params: { projectId } }) =>
    queryClient.ensureQueryData(testCasesByProjectIdQueryOptions(projectId)),
  component: CreateNewTestPlan,
});

type CreateTestPlanForm = TestPlanCreationFormValues;

function CreateNewTestPlan() {
  const { t } = useTranslation();
  const createTestPlanMutation = useCreateTestPlanMutation();
  const testersQuery = useTestersQuery();
  const redirect = useNavigate();
  const { projectId } = Route.useParams();

  const { data: envData } = useSuspenseQuery(
    findEnvironmentsByProjectQueryOptions(projectId!)
  );
  const environments = envData?.environments ?? [];

  const [selectedTestCases, setSelectedTestCases] = useState<SelectAssignedTestCase[]>([]);
  const [activeTestCaseId, setActiveTestCaseId] = useState<string | null>(null);
  const activeTestCase = selectedTestCases.find((t) => t.test_case_id === activeTestCaseId);

  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkSelectedTesters, setBulkSelectedTesters] = useState<string[]>([]);

  const {
    data: testCases,
    isPending,
    error,
  } = useSuspenseQuery(testCasesByProjectIdQueryOptions(projectId));

  if (isPending) {
    return (
      <Flex justify="center" align="center" minH="40">
        <Spinner size="xl" color="brand.solid" />
      </Flex>
    );
  }

  if (error) {
    return <Text color="fg.error">{t("test_plans.error_cases")}</Text>;
  }

  const testers = testersQuery.data?.testers ?? [];

  async function handleSubmit(data: CreateTestPlanForm) {
    const { isValid, unassigned } = validateTestCaseAssignments(selectedTestCases);
    if (!isValid) {
      toaster.create({
        title: t("test_plans.assign_error"),
        description: t("test_plans.assign_missing", { count: unassigned.length }),
        type: "error",
        duration: 4000,
      });
      return;
    }

    if (!data.environment_id) {
      redirect({
        to: "/projects/$projectId/environments/new",
        params: { projectId },
        search: { from: "test-plan-creation" },
      });
      return;
    }

    const res = await createTestPlanMutation.mutateAsync({
      body: {
        project_id: parseInt(projectId!),
        environment_id: Number(data.environment_id),
        kind: data.kind,
        description: data.description,
        start_at: new Date(data.start_at).toISOString(),
        scheduled_end_at: new Date(data.scheduled_end_at).toISOString(),
        closed_at: data.closed_at ? new Date(data.closed_at).toISOString() : undefined,
        planned_tests: selectedTestCases.map((tc) => ({
          test_case_id: tc.test_case_id,
          user_ids: tc.user_ids.map(Number),
        })),
      },
    });

    if (res) {
      toaster.create({
        title: t("test_plans.create.success"),
        description: t("test_plans.create.description"),
        type: "success",
      });
      redirect({
        to: "/projects/$projectId/test-plans",
        params: { projectId },
      });
    }
  }

  function openAssignModal(testCaseId: string) {
    setActiveTestCaseId(testCaseId);
  }

  function validateTestCaseAssignments(selectedTestCases: SelectAssignedTestCase[]) {
    const unassigned = selectedTestCases.filter((tc) => tc.user_ids.length === 0);
    return { isValid: unassigned.length === 0, unassigned };
  }

  return (
    <div>
      <Toaster />
      <Box p={6}>
        <Heading color="fg.heading">{t("test_plans.create_new")}</Heading>

        {environments.length === 0 && (
          <Box
            mb={4}
            p={4}
            border="1px solid"
            borderColor="orange.200"
            borderRadius="md"
            bg="orange.50"
          >
            <Text mb={2} fontWeight="500" color="orange.900">
              {t("test_plans.no_envs")}
            </Text>
            <Text mb={3} fontSize="sm" color="orange.800">
              {t("test_plans.no_envs_description")}
            </Text>
            <Link
              to="/projects/$projectId/environments/new"
              params={{ projectId }}
              search={{ from: "test-plan-creation" }}
            >
              <Button size="sm" colorPalette="orange">
                {t("test_plans.create_env")}
              </Button>
            </Link>
          </Box>
        )}

        <DynamicForm
          schema={testPlanCreationSchema}
          fields={testPlanCreationFields.map((f) =>
            f.name === "environment_id"
              ? {
                  ...f,
                  options: environments.map((e: any) => ({
                    label: e.name,
                    value: String(e.id),
                  })),
                }
              : f
          )}
          onSubmit={handleSubmit}
          submitText={t("test_plans.create")}
          layout="vertical"
          spacing={4}
        />

        <Heading color="fg.heading">{t("test_plans.select_assign_cases")}</Heading>

        <Flex
          mb={4}
          p={3}
          border="sm"
          borderColor="border.subtle"
          borderRadius="lg"
          bg="bg.surface"
          align="center"
          justify="space-between"
        >
          <Box fontSize="sm">
            <strong>{selectedTestCases.length}</strong>{" "}
            {t("test_plans.selected_cases", { count: selectedTestCases.length })}
          </Box>
          <Button
            size="sm"
            variant="solid"
            colorPalette="brand"
            disabled={selectedTestCases.length === 0}
            onClick={() => setBulkAssignOpen(true)}
          >
            {t("test_plans.bulk_assign")}
          </Button>
        </Flex>

        {testCases.test_cases?.map((testCase) => (
          <Box
            key={testCase.id}
            border="sm"
            borderColor="border.subtle"
            borderRadius="lg"
            bg="bg.surface"
            p={4}
            mb={3}
          >
            <Flex justify="space-between" align="center">
              <Checkbox.Root
                checked={selectedTestCases.some(
                  (t) => t.test_case_id === testCase.id!.toString()
                )}
                onCheckedChange={(e) => {
                  if (e.checked) {
                    setSelectedTestCases((prev) => [
                      ...prev,
                      { test_case_id: testCase.id!.toString(), user_ids: [] },
                    ]);
                  } else {
                    setSelectedTestCases((prev) =>
                      prev.filter((t) => t.test_case_id !== testCase.id!.toString())
                    );
                  }
                }}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label>
                  <strong>{testCase.code}</strong> — {testCase.title}
                </Checkbox.Label>
              </Checkbox.Root>

              <Button
                size="sm"
                colorPalette="brand"
                variant="outline"
                onClick={() => openAssignModal(testCase.id!.toString())}
              >
                {t("test_plans.assign_tester")}
              </Button>
            </Flex>

                        {selectedTestCases.find((t) => t.test_case_id === testCase.id!.toString())
              ?.user_ids.length ? (
              <Flex mt={2} gap={2} wrap="wrap">
                {selectedTestCases
                  .find((t) => t.test_case_id === testCase.id!.toString())!
                  .user_ids.map((uid) => {
                    const tester = testers.find(
                      (t) => t.user_id?.toString() === uid.toString()
                    );
                    return (
                      <Box
                        key={uid}
                        px={2}
                        py={1}
                        bg="bg.muted"
                        borderRadius="md"
                        fontSize="sm"
                        color="fg.muted"
                      >
                        {tester?.name}
                      </Box>
                    );
                  })}
              </Flex>
            ) : (
              <Box mt={2} fontSize="sm" color="fg.subtle">
                {t("test_plans.no_testers")}
              </Box>
            )}
          </Box>
        ))}

      </Box>

      {/* Assign testers modal */}
      <AppDialog
        open={!!activeTestCaseId}
        onOpenChange={() => setActiveTestCaseId(null)}
        title={t("test_plans.assign_modal_title")}
        footer={
          <Button
            colorPalette="brand"
            onClick={() => setActiveTestCaseId(null)}
          >
            {t("test_plans.done")}
          </Button>
        }
      >
        <CheckboxGroup
          value={activeTestCase?.user_ids.map(String) ?? []}
          onValueChange={(value) => {
            setSelectedTestCases((prev) => {
              const exists = prev.find((t) => t.test_case_id === activeTestCaseId);
              if (exists) {
                return prev.map((t) =>
                  t.test_case_id === activeTestCaseId
                    ? { ...t, user_ids: value.map(Number) }
                    : t
                );
              }
              return [
                ...prev,
                { test_case_id: activeTestCaseId!, user_ids: value.map(Number) },
              ];
            });
          }}
        >
          <Fieldset.Root>
            <Fieldset.Legend fontSize="sm">
              {t("test_plans.select_testers")}
            </Fieldset.Legend>
            <Fieldset.Content>
              <For each={testers}>
                {(tester) => (
                  <Checkbox.Root
                    key={tester.user_id}
                    value={tester.user_id!.toString()}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label>{tester.name}</Checkbox.Label>
                  </Checkbox.Root>
                )}
              </For>
            </Fieldset.Content>
          </Fieldset.Root>
        </CheckboxGroup>
      </AppDialog>

      {/* Bulk assign modal */}
      <AppDialog
        open={bulkAssignOpen}
        onOpenChange={(event) => setBulkAssignOpen(event.open)}
        title={t("test_plans.bulk_assign_title")}
        footer={
          <>
            <Button variant="outline" onClick={() => setBulkAssignOpen(false)}>
              {t("test_plans.cancel")}
            </Button>
            <Button
              colorPalette="brand"
              disabled={bulkSelectedTesters.length === 0}
              onClick={() => {
                setSelectedTestCases((prev) =>
                  prev.map((tc) => ({
                    ...tc,
                    user_ids: Array.from(
                      new Set([...tc.user_ids, ...bulkSelectedTesters.map(Number)])
                    ),
                  }))
                );
                setBulkSelectedTesters([]);
                setBulkAssignOpen(false);
              }}
            >
              {t("test_plans.assign_tester")}
            </Button>
          </>
        }
      >
        <Box fontSize="sm" mb={3} color="fg.muted">
          {t("test_plans.bulk_assign_description", {
            count: selectedTestCases.length,
          })}
        </Box>
        <CheckboxGroup
          value={bulkSelectedTesters}
          onValueChange={setBulkSelectedTesters}
        >
          <Fieldset.Root>
            <Fieldset.Legend fontSize="sm">
              {t("test_plans.select_testers")}
            </Fieldset.Legend>
            <Fieldset.Content>
              <For each={testers}>
                {(tester) => (
                  <Checkbox.Root
                    key={tester.user_id}
                    value={tester.user_id!.toString()}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label>{tester.name}</Checkbox.Label>
                  </Checkbox.Root>
                )}
              </For>
            </Fieldset.Content>
          </Fieldset.Root>
        </CheckboxGroup>
      </AppDialog>
    </div>
  );
}
