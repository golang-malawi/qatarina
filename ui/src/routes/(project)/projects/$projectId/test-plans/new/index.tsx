import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
  Stack,
} from "@chakra-ui/react";
import { Toaster, toaster } from "@/components/ui/toaster";
import { AppDialog } from "@/components/ui/app-dialog";
import { keepPreviousData, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SelectAssignedTestCase } from "@/common/models";
import { useCreateTestPlanMutation } from "@/services/TestPlanService";
import { useProjectTestersQuery } from "@/services/TesterService"; 
import { testCasesByProjectIdQueryOptions } from "@/data/queries/test-cases";
import { DynamicForm } from "@/components/form/DynamicForm";
import {
  testPlanCreationSchema,
  TestPlanCreationFormValues,
} from "@/data/forms/test-plan-schemas";
import { testPlanCreationFields } from "@/data/forms/test-plan-field-configs";
import { findEnvironmentsByProjectQueryOptions } from "@/data/queries/environments";
import { useTranslation } from "react-i18next";

const TEST_CASES_PAGE_SIZE = 10;

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-plans/new/"
)({
  loader: ({ context: { queryClient }, params: { projectId } }) =>
    queryClient.ensureQueryData(
      testCasesByProjectIdQueryOptions(projectId, {
        page: 1,
        pageSize: TEST_CASES_PAGE_SIZE,
      })
    ),
  component: CreateNewTestPlan,
});

type CreateTestPlanForm = TestPlanCreationFormValues;

// "Select all" is resolved on the backend, so only deselected test cases and the
// default testers are tracked instead of loading every test case in the project
type AllTestCasesSelection = {
  excludedIds: Set<string>;
  userIds: number[];
};

function CreateNewTestPlan() {
  const { t } = useTranslation();
  const createTestPlanMutation = useCreateTestPlanMutation();
  const redirect = useNavigate();
  const { projectId } = Route.useParams();

  const testersQuery = useProjectTestersQuery(Number(projectId)); 
  const testers = testersQuery.data?.testers ?? [];

  const { data: envData } = useSuspenseQuery(
    findEnvironmentsByProjectQueryOptions(projectId!)
  );
  const environments = envData?.environments ?? [];

  const [selectedTestCases, setSelectedTestCases] = useState<SelectAssignedTestCase[]>([]);
  const [activeTestCaseId, setActiveTestCaseId] = useState<string | null>(null);
  const activeTestCase = selectedTestCases.find((t) => t.test_case_id === activeTestCaseId);

  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkSelectedTesters, setBulkSelectedTesters] = useState<string[]>([]);

  const [page, setPage] = useState(1);
  const [allSelection, setAllSelection] = useState<AllTestCasesSelection | null>(null);
  const {
    data: testCases,
    isPending,
    isFetching,
    error,
  } = useQuery({
    ...testCasesByProjectIdQueryOptions(projectId, {
      page,
      pageSize: TEST_CASES_PAGE_SIZE,
    }),
    placeholderData: keepPreviousData,
  });

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

  const totalTestCases = testCases?.pagination?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalTestCases / TEST_CASES_PAGE_SIZE));

  // In "select all" mode selectedTestCases only holds per-case tester overrides
  const selectedCount = allSelection
    ? Math.max(0, totalTestCases - allSelection.excludedIds.size)
    : selectedTestCases.length;
  const selectAllChecked = allSelection
    ? allSelection.excludedIds.size === 0
      ? true
      : "indeterminate"
    : false;

  function handleSelectAll(checked: boolean) {
    setSelectedTestCases([]);
    setAllSelection(checked ? { excludedIds: new Set(), userIds: [] } : null);
  }

  function isTestCaseSelected(testCaseId: string) {
    if (allSelection) return !allSelection.excludedIds.has(testCaseId);
    return selectedTestCases.some((tc) => tc.test_case_id === testCaseId);
  }

  function setTestCaseSelected(testCaseId: string, checked: boolean) {
    if (allSelection) {
      setAllSelection((prev) => {
        if (!prev) return prev;
        const excludedIds = new Set(prev.excludedIds);
        if (checked) excludedIds.delete(testCaseId);
        else excludedIds.add(testCaseId);
        return { ...prev, excludedIds };
      });
    }
    setSelectedTestCases((prev) => {
      if (!checked) return prev.filter((tc) => tc.test_case_id !== testCaseId);
      if (allSelection || prev.some((tc) => tc.test_case_id === testCaseId)) return prev;
      return [...prev, { test_case_id: testCaseId, user_ids: [] }];
    });
  }

  function testerIdsFor(testCaseId: string): number[] {
    const override = selectedTestCases.find((tc) => tc.test_case_id === testCaseId);
    if (override?.user_ids.length) return override.user_ids.map(Number);
    if (allSelection && !allSelection.excludedIds.has(testCaseId)) return allSelection.userIds;
    return [];
  }

  async function handleSubmit(data: CreateTestPlanForm) {
    const unassignedCount = allSelection
      ? allSelection.userIds.length === 0
        ? selectedCount - selectedTestCases.filter((tc) => tc.user_ids.length > 0).length
        : 0
      : validateTestCaseAssignments(selectedTestCases).unassigned.length;
    if (unassignedCount > 0) {
      toaster.create({
        title: t("test_plans.assign_error"),
        description: t("test_plans.assign_missing", { count: unassignedCount }),
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

    const toISODate = (dateStr: string) => new Date(dateStr + "T00:00:00").toISOString();

    const res = await createTestPlanMutation.mutateAsync({
      body: {
        project_id: parseInt(projectId!),
        environment_id: Number(data.environment_id),
        kind: data.kind,
        description: data.description,
        start_at: data.start_at ? toISODate(data.start_at) : new Date().toISOString(),
        scheduled_end_at: toISODate(data.scheduled_end_at),
        closed_at: data.closed_at ? toISODate(data.closed_at) : undefined,
        planned_tests: selectedTestCases
          .filter((tc) => !allSelection || tc.user_ids.length > 0)
          .map((tc) => ({
            test_case_id: tc.test_case_id,
            user_ids: tc.user_ids.map(Number),
          })),
        all_test_cases: allSelection
          ? {
              user_ids: allSelection.userIds,
              excluded_test_case_ids: Array.from(allSelection.excludedIds),
            }
          : undefined,
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
    // In "select all" mode, start the per-case override from the default testers
    if (allSelection && !selectedTestCases.some((tc) => tc.test_case_id === testCaseId)) {
      setSelectedTestCases((prev) => [
        ...prev,
        { test_case_id: testCaseId, user_ids: testerIdsFor(testCaseId) },
      ]);
    }
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

        {/* Environment warning */}
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

        {/* Form */}
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

        {/* Test case selection */}
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
            <strong>{selectedCount}</strong>{" "}
            {t("test_plans.selected_cases", { count: selectedCount })}
          </Box>

          <Button
            size="sm"
            variant="solid"
            colorPalette="brand"
            disabled={selectedCount === 0}
            onClick={() => setBulkAssignOpen(true)}
          >
            {t("test_plans.bulk_assign")}
          </Button>
        </Flex>

        <Box
          mb={4}
          p={4}
          border="sm"
          borderColor="border.subtle"
          borderRadius="lg"
          bg="bg.surface"
        >
          <Checkbox.Root
            checked={selectAllChecked}
            onCheckedChange={(e) => handleSelectAll(e.checked === true)}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label>
              {t("test_plans.select_all_cases", { count: totalTestCases })}
            </Checkbox.Label>
          </Checkbox.Root>
        </Box>

        {testCases?.test_cases?.map((testCase) => (
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
                checked={isTestCaseSelected(testCase.id!.toString())}
                onCheckedChange={(e) =>
                  setTestCaseSelected(testCase.id!.toString(), e.checked === true)
                }
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

            {/* Assigned testers preview */}
            {testerIdsFor(testCase.id!.toString()).length ? (
              <Flex mt={2} gap={2} wrap="wrap">
                {testerIdsFor(testCase.id!.toString()).map((uid) => {
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

        {totalPages > 1 && (
          <Flex justify="space-between" align="center" mt={2}>
            <Button
              size="xs"
              variant="outline"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1 || isFetching}
            >
              {t("test_plans.previous_page")}
            </Button>
            <Text fontSize="xs" color="fg.muted">
              {t("test_plans.page_of", { page, totalPages, total: totalTestCases })}
            </Text>
            <Button
              size="xs"
              variant="outline"
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages || isFetching}
            >
              {t("test_plans.next_page")}
            </Button>
          </Flex>
        )}
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
        {testers.length === 0 ? (
          <Stack gap={2}>
            <Text color="fg.error">{t("testers.none_assigned")}</Text>
            <Button
              size="sm"
              colorPalette="brand"
              onClick={() =>
                redirect({
                  to: "/projects/$projectId/testers/new",
                  params: { projectId },
                })
              }
            >
              {t("testers.add_button")}
            </Button>
          </Stack>
        ) : (
          <CheckboxGroup
            value={activeTestCase?.user_ids.map(String) ?? []}
            onValueChange={(value) => {
              if (allSelection && activeTestCaseId) setTestCaseSelected(activeTestCaseId, true);
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
        )}
      </AppDialog>

      {/* Bulk assign modal */}
      <AppDialog
        open={bulkAssignOpen}
        onOpenChange={(event) => setBulkAssignOpen(event.open)}
        title={t("test_plans.bulk_assign")}
        footer={
          <>
            <Button variant="outline" onClick={() => setBulkAssignOpen(false)}>
              {t("test_plans.cancel")}
            </Button>
            <Button
              colorPalette="brand"
              disabled={bulkSelectedTesters.length === 0}
              onClick={() => {
                if (allSelection) {
                  setAllSelection((prev) =>
                    prev && {
                      ...prev,
                      userIds: Array.from(
                        new Set([...prev.userIds, ...bulkSelectedTesters.map(Number)])
                      ),
                    }
                  );
                }
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
        {testers.length === 0 ? (
          <Stack gap={2}>
            <Text color="fg.error">{t("testers.none_assigned")}</Text>
            <Button
              size="sm"
              colorPalette="brand"
              onClick={() =>
                redirect({
                  to: "/projects/$projectId/testers/new",
                  params: { projectId },
                })
              }
            >
              {t("testers.add_button")}
            </Button>
          </Stack>
        ) : (
          <>
            <Box fontSize="sm" mb={3} color="fg.muted">
              {t("test_plans.bulk_assign_description", {
                count: selectedCount,
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
          </>
        )}
      </AppDialog>
    </div>
  );
}