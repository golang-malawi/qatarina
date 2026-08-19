import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Button,
  Box,
  Flex,
  Heading,
  Table,
  Tabs,
  Text,
  Menu,
  CheckboxGroup,
  Checkbox,
  Fieldset,
  For,
} from "@chakra-ui/react";
import { IconList, IconListDetails } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import React, { useRef, useState } from "react";
import type { components } from "@/lib/api/v1";
import { Toaster, toaster } from "@/components/ui/toaster";
import { AppDataTable, AppTableColumn } from "@/components/ui/app-data-table";
import { AppDialog } from "@/components/ui/app-dialog";
import SelectFeatureModule from "@/components/form/SelectFeatureModule";
import {
  TestCaseListQueryParams,
  testCasesByProjectIdQueryOptions,
} from "@/data/queries/test-cases";
import { LuEye, LuGitBranch, LuPencil } from "react-icons/lu";
import {
  useClosedTestCasesQuery,
  useFailingTestCasesQuery,
  useScheduledTestCasesQuery,
  importTestCasesFromFile,
  useBlockedTestCasesQuery,
  useSuggestedTestCasesQuery,
  approveSuggestedTestCase,
  rejectSuggestedTestCase,
  branchTestCase,
  markTestCaseAsDraft,
  unMarkTestCaseAsDraft,
  deleteTestCase,
} from "@/services/TestCaseService";
import { useProjectTestPlansQuery, assignTestersToTestPlan } from "@/services/TestPlanService";
import { useUsersQuery } from "@/services/UserService";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-cases/",
)({
  component: ListProjectTestCases,
});

type TestCase = components["schemas"]["schema.TestCaseResponse"];

type TestCaseListResponse =
  components["schemas"]["schema.TestCaseListResponse"];

export default function ListProjectTestCases() {
  const { projectId } = Route.useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();
  const [moduleFilter, setModuleFilter] = useState<string>("");
  const [selectedRows, setSelectedRows] = useState<TestCase[]>([]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkAssignStep, setBulkAssignStep] = useState<"plan" | "users">("plan");
  const [selectedTestPlans, setSelectedTestPlans] = useState<string[]>([]);
  const [bulkSelectedUsers, setBulkSelectedUsers] = useState<string[]>([]);

  const queryFactory = React.useCallback(
    ({
      page,
      pageSize,
      sortBy,
      sortOrder,
      search,
    }: TestCaseListQueryParams) => ({
      ...testCasesByProjectIdQueryOptions(projectId, {
        page,
        pageSize,
        sortBy,
        sortOrder,
        search: moduleFilter || search,
      }),
      enabled: !!projectId,
    }),
    [projectId, moduleFilter],
  );

  const { data: usersData } = useUsersQuery();
 
  const { data: testPlansData } = useProjectTestPlansQuery(projectId);
  
  const userMap = Object.fromEntries(
    (usersData?.users ?? []).map((u: any) => [u.id, u.displayName]),
  );

  const columns: AppTableColumn<TestCase>[] = [
    { key: "code", header: t("test_cases.column.code"), sortKey: "code" },
    { key: "title", header: t("test_cases.column.title"), sortKey: "title" },
    { key: "kind", header: t("test_cases.column.kind"), sortKey: "kind" },
    {
      key: "is_draft",
      header: t("test_cases.column.draft"),
      type: "enum",
      sortKey: "is_draft",
      enumOptions: {
        map: {
          true: {
            label: t("test_cases.status.draft"),
            colorPalette: "orange",
          },
          false: {
            label: t("test_cases.status.active"),
            colorPalette: "green",
          },
        },
      },
      align: "center",
      width: "120px",
    },
    {
      key: "created_at",
      header: t("test_cases.column.created"),
      type: "date",
      sortKey: "created_at",
      align: "end",
      width: "140px",
    },
  ];

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const response = await importTestCasesFromFile(projectId, file);
      const msg = response.message;

      let toastType: "success" | "warning" | "info" = "success";
      let title = "Import result";

      if (msg.startsWith("Imported 0")) {
        toastType = "warning";
        title = "No new test cases imported";
      } else if (msg.includes("skipped") && !msg.startsWith("Imported 0")) {
        toastType = "success";
        title = "Import completed with duplicates";
      } else {
        toastType = "success";
        title = "Import successful";
      }

      toaster.create({ title, description: msg, type: toastType });

      await queryClient.invalidateQueries({
        queryKey: ["get", "/v1/projects/{projectID}/test-cases"],
      });

      e.target.value = "";
    } catch (err: any) {
      toaster.create({
        title: "Import failed",
        description: err?.message || "Failed to import test cases",
        type: "error",
      });
    }
  };

  const handleBulkUseInTestSession = () => {
    if (selectedRows.length === 0) return;
    setBulkAssignOpen(true);
    setBulkAssignStep("plan");
    setSelectedTestPlans([]);
    setBulkSelectedUsers([]);
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;
    try {
      await Promise.all(
        selectedRows.map((row) => {
          if (row.id) return deleteTestCase(String(row.id));
          return Promise.resolve();
        })
      );
      toaster.success({ title: t("test_cases.delete.success") });
      await queryClient.invalidateQueries({
        queryKey: ["get", "/v1/projects/{projectID}/test-cases"],
      });
      setSelectedRows([]);
      setRowSelection({});
    } catch (err: any) {
      toaster.error({
        title: t("test_cases.delete.error"),
        description: err?.message,
      });
    }
  };

  const projectTestPlans = Array.isArray(testPlansData)
    ? testPlansData
    : (testPlansData as any)?.test_plans ?? (testPlansData as any)?.data ?? [];

  return (
    <div>
      <Toaster />
      <Heading as="h6" size="xl" color="fg.heading">
        {t("test_cases")}
      </Heading>
      <Text colorPalette={"gray.500"}>
        {t("test_cases.header_description")}
      </Text>
      <Flex
        py={"4"}
        px={"4"}
        align={"right"}
        mb={2}
        gap={3}
        alignItems={"flex-end"}
        className="actions"
      >
        <Link
          to={"/projects/$projectId/test-cases/new"}
          params={{ projectId: projectId }}
        >
          <Button variant={"solid"} colorPalette="brand" size={"sm"}>
            {t("test_cases.add")}
          </Button>
        </Link>
        <Button colorPalette="success" size="sm" onClick={handleImportClick}>
          {t("test_cases.import_from_excel")}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </Flex>

      <Tabs.Root defaultValue="all">
        <Tabs.List>
          <Tabs.Trigger value="all">
            <IconList />
            &nbsp;{t("test_cases.tab.all")}
          </Tabs.Trigger>

          <Tabs.Trigger color={"blue"} value="suggested">
            <IconListDetails />
            &nbsp;{t("test_cases.tab.suggested")}
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="all">
          <Box mt={2}>
            <SelectFeatureModule
              projectId={projectId}
              value={moduleFilter}
              onChange={setModuleFilter}
            />
          </Box>

          <Box mt={4}>
            <AppDataTable<TestCase, TestCaseListResponse>
              // @ts-expect-error TODO(sevenreup)
              query={queryFactory}
              columns={columns}
              defaultSort={{ key: "created_at", desc: true }}
              showGlobalFilter
              filterPlaceholder={t("test_cases.search_placeholder")}
              enableRowSelection={true}
              rowSelection={rowSelection}
              onRowSelectionChange={(newSelection) => {
                setRowSelection(newSelection);
              }}
              onRowSelectionChangeRows={(rows) => {
                setSelectedRows(rows);
              }}
              renderBulkActions={() => (
                <Menu.Root>
                  <Menu.Trigger asChild>
                    <Button size="sm" colorPalette="brand">
                      Manage selected
                    </Button>
                  </Menu.Trigger>
                  <Menu.Positioner>
                    <Menu.Content bg="bg.surface" border="1px solid" borderColor="border.subtle" shadow="md">
                      <Menu.Item value="use-session" onClick={handleBulkUseInTestSession}>
                        {t("test_cases.use_in_test_session")}
                      </Menu.Item>
                      <Menu.Item value="delete" color="fg.error" onClick={handleBulkDelete}>
                        {t("test_cases.delete")}
                      </Menu.Item>
                    </Menu.Content>
                  </Menu.Positioner>
                </Menu.Root>
              )}
              dataAccessor={(response) => {
                return (response?.test_cases ?? []) as TestCase[];
              }}
              paginationAccessor={(response) => {
                const pagination = response?.pagination;
                if (!pagination) return undefined;
                return {
                  total: pagination.total ?? 0,
                  page: pagination.page ?? 1,
                  pageSize: pagination.pageSize ?? 10,
                };
              }}
              rowActions={[
                {
                  name: "view",
                  label: t("test_cases.view"),
                  icon: LuEye,
                  link: (row) =>
                    `/projects/${projectId}/test-cases/${String(row.id ?? "")}`,
                },
                {
                  name: "edit",
                  label: t("test_cases.edit"),
                  icon: LuPencil,
                  link: (row) =>
                    `/projects/${projectId}/test-cases/${String(row.id ?? "")}/edit`,
                },
                {
                  name: "branch",
                  label: t("test_cases.branch"),
                  icon: LuGitBranch,
                  onClick: async (row) => {
                    if (!row.id) return;
                    try {
                      const branched = await branchTestCase(String(row.id));
                      const newId = branched?.data?.id ?? (branched as any)?.id;

                      if (!newId) {
                        throw new Error(
                          "Branching did not return a new test case ID",
                        );
                      }

                      toaster.success({
                        title: t("test_cases.branch.success"),
                        description: t("test_cases.branch.success_description"),
                      });

                      await queryClient.invalidateQueries({
                        queryKey: ["get", "/v1/projects/{projectID}/test-cases"],
                      });

                      navigate({
                        to: "/projects/$projectId/test-cases/$testCaseId/edit",
                        params: { projectId, testCaseId: String(newId) },
                        search: { isBranched: true },
                      });
                    } catch (err: any) {
                      toaster.error({
                        title: t("test_cases.branch.error"),
                        description: err?.message || "Could not branch test case.",
                      });
                    }
                  },
                },
                {
                  name: "toggle-draft",
                  label: (row) =>
                    row.is_draft
                      ? t("test_cases.unmark_as_draft")
                      : t("test_cases.mark_as_draft"),
                  onClick: async (row) => {
                    if (!row.id) return;
                    try {
                      if (row.is_draft) {
                        await unMarkTestCaseAsDraft(String(row.id));
                        toaster.success({ title: t("test_cases.unmark_draft.success") });
                      } else {
                        await markTestCaseAsDraft(String(row.id));
                        toaster.success({ title: t("test_cases.mark_draft.success") });
                      }
                      await queryClient.invalidateQueries({
                        queryKey: ["get", "/v1/projects/{projectID}/test-cases"],
                      });
                    } catch (err: any) {
                      toaster.error({
                        title: row.is_draft
                          ? t("test_cases.unmark_draft.error")
                          : t("test_cases.mark_draft.error"),
                        description: err?.message,
                      });
                    }
                  },
                },
                {
                  name: "use",
                  label: t("test_cases.use_in_test_session"),
                  link: (row) =>
                    `/projects/${projectId}/test-cases/${String(row.id ?? "")}?tab=usage`,
                },
                {
                  name: "delete",
                  label: t("test_cases.delete"),
                  color: "fg.error",
                  onClick: async (row) => {
                    if (!row.id) return;
                    try {
                      await deleteTestCase(String(row.id));
                      toaster.success({ title: t("test_cases.delete.success") });
                      await queryClient.invalidateQueries({
                        queryKey: ["get", "/v1/projects/{projectID}/test-cases"],
                      });
                    } catch (err: any) {
                      toaster.error({
                        title: t("test_cases.delete.error"),
                        description: err?.message,
                      });
                    }
                  },
                },
              ]}
            />
          </Box>
        </Tabs.Content>
        <Tabs.Content value="completed">
          <ClosedTestCasesTab projectID={projectId} userMap={userMap} />
        </Tabs.Content>
        <Tabs.Content value="failing">
          <FailingTestCasesTab projectID={projectId} userMap={userMap} />
        </Tabs.Content>
        <Tabs.Content value="scheduled">
          <ScheduledTestCasesTab projectID={projectId} userMap={userMap} />
        </Tabs.Content>
        <Tabs.Content value="blocked">
          <BlockedTestCasesTab projectID={projectId} userMap={userMap} />
        </Tabs.Content>
        <Tabs.Content value="suggested">
          <SuggestedTestCasesTab projectID={projectId} />
        </Tabs.Content>
      </Tabs.Root>

      {/* Bulk assign modal - Step 1: Select Test Plans with Checkboxes */}
      {bulkAssignStep === "plan" && (
        <AppDialog
          open={bulkAssignOpen}
          onOpenChange={(event) => {
            if (!event.open) {
              setBulkAssignOpen(false);
              setBulkAssignStep("plan");
              setSelectedTestPlans([]);
            }
          }}
          title={t("test_plans.bulk_assign_title")}
          footer={
            <>
              <Button variant="outline" onClick={() => setBulkAssignOpen(false)}>
                {t("test_plans.cancel")}
              </Button>
              <Button
                colorPalette="brand"
                disabled={selectedTestPlans.length === 0}
                onClick={() => {
                  setBulkAssignStep("users");
                }}
              >
                {t("test_plans.confirm_assignment")}
              </Button>
            </>
          }
        >
          <Box fontSize="sm" mb={3} color="fg.muted">
            Select test plan(s) to add {selectedRows.length} test case(s)
          </Box>
          <Box maxH="300px" overflowY="auto" pr={2}>
            {projectTestPlans.length === 0 ? (
              <Text fontSize="sm" color="fg.muted" py={4} textAlign="center">
                No test plans found for this project.
              </Text>
            ) : (
              <CheckboxGroup
                value={selectedTestPlans}
                onValueChange={setSelectedTestPlans}
              >
                <Fieldset.Root>
                  <Fieldset.Content>
                    <For each={projectTestPlans}>
                      {(plan: any) => (
                        <Checkbox.Root
                          key={plan.id}
                          value={String(plan.id)}
                          p={3}
                          mb={2}
                          border="1px solid"
                          borderColor={
                            selectedTestPlans.includes(String(plan.id))
                              ? "border.positive"
                              : "border.subtle"
                          }
                          borderRadius="md"
                          bg={
                            selectedTestPlans.includes(String(plan.id))
                              ? "bg.muted"
                              : "transparent"
                          }
                          width="100%"
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label width="100%">
                            <Text fontWeight="medium">
                              {plan.description || plan.name || `Test Plan #${plan.id}`}
                            </Text>
                            <Text fontSize="xs" color="fg.muted">
                              Kind: {plan.kind || "N/A"} · Status: {plan.status || "N/A"}
                            </Text>
                          </Checkbox.Label>
                        </Checkbox.Root>
                      )}
                    </For>
                  </Fieldset.Content>
                </Fieldset.Root>
              </CheckboxGroup>
            )}
          </Box>
        </AppDialog>
      )}

      {/* Bulk assign modal - Step 2: Select Users */}
      {bulkAssignStep === "users" && (
        <AppDialog
          open={bulkAssignOpen}
          onOpenChange={(event) => {
            if (!event.open) {
              setBulkAssignOpen(false);
              setBulkAssignStep("plan");
              setSelectedTestPlans([]);
            }
          }}
          title={t("test_plans.bulk_assign_title")}
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setBulkAssignStep("plan");
                }}
              >
                {t("test_plans.cancel")}
              </Button>
              <Button
                colorPalette="brand"
                disabled={bulkSelectedUsers.length === 0}
                onClick={async () => {
                  try {
                    await Promise.all(
                      selectedTestPlans.map((planId) =>
                        assignTestersToTestPlan(planId, {
                          project_id: Number(projectId),
                          test_plan_id: Number(planId),
                          planned_tests: selectedRows.map((row) => ({
                            test_case_id: String(row.id),
                            user_ids: bulkSelectedUsers.map(Number),
                          })),
                        })
                      )
                    );

                    toaster.create({
                      title: "Success",
                      description: `Successfully assigned ${selectedRows.length} test case(s) to test plan(s)`,
                      type: "success",
                    });

                    await queryClient.invalidateQueries({
                      queryKey: ["get", "/v1/test-plans/{testPlanID}/test-cases"],
                    });

                    setBulkSelectedUsers([]);
                    setBulkAssignOpen(false);
                    setBulkAssignStep("plan");
                    setSelectedTestPlans([]);
                    setSelectedRows([]);
                    setRowSelection({});
                  } catch (err: any) {
                    toaster.create({
                      title: "Assignment failed",
                      description: err?.message || "Failed to assign test cases to test plan",
                      type: "error",
                    });
                  }
                }}
              >
                {t("test_plans.confirm_assignment")}
              </Button>
            </>
          }
        >
          <Box fontSize="sm" mb={3} color="fg.muted">
            {t("test_plans.bulk_assign_description", {
              count: selectedRows.length,
            })}
          </Box>
          <CheckboxGroup value={bulkSelectedUsers} onValueChange={setBulkSelectedUsers}>
            <Fieldset.Root>
              <Fieldset.Legend fontSize="sm">
                {t("test_plans.select_testers")}
              </Fieldset.Legend>
              <Fieldset.Content>
                <For each={userMap ? Object.entries(userMap) : []}>
                  {([userId, userName]) => (
                    <Checkbox.Root key={userId} value={userId}>
                      <Checkbox.HiddenInput />
                      <Checkbox.Control />
                      <Checkbox.Label>{String(userName)}</Checkbox.Label>
                    </Checkbox.Root>
                  )}
                </For>
              </Fieldset.Content>
            </Fieldset.Root>
          </CheckboxGroup>
        </AppDialog>
      )}
    </div>
  );
}

function ClosedTestCasesTab({
  projectID,
  userMap,
}: {
  projectID: string;
  userMap: Record<number, string>;
}) {
  const { data, isLoading, error } = useClosedTestCasesQuery(projectID);
  const { t } = useTranslation();
  return (
    <TestCasesTable
      testCases={data?.test_cases ?? []}
      isLoading={isLoading}
      error={error}
      loadingMessage={t("test_cases.loading.closed")}
      errorMessage={t("test_cases.error.closed")}
      userMap={userMap}
    />
  );
}

function FailingTestCasesTab({
  projectID,
  userMap,
}: {
  projectID: string;
  userMap: Record<number, string>;
}) {
  const { data, isLoading, error } = useFailingTestCasesQuery(projectID);
  const { t } = useTranslation();
  return (
    <TestCasesTable
      testCases={data?.test_cases ?? []}
      isLoading={isLoading}
      error={error}
      loadingMessage={t("test_cases.loading.failing")}
      errorMessage={t("test_cases.error.failing")}
      userMap={userMap}
    />
  );
}

function ScheduledTestCasesTab({
  projectID,
  userMap,
}: {
  projectID: string;
  userMap: Record<number, string>;
}) {
  const { data, isLoading, error } = useScheduledTestCasesQuery(projectID);
  const { t } = useTranslation();
  return (
    <TestCasesTable
      testCases={data?.test_cases ?? []}
      isLoading={isLoading}
      error={error}
      loadingMessage={t("test_cases.loading.scheduled")}
      errorMessage={t("test_cases.error.scheduled")}
      userMap={userMap}
    />
  );
}

function BlockedTestCasesTab({
  projectID,
  userMap,
}: {
  projectID: string;
  userMap: Record<number, string>;
}) {
  const { data, isLoading, error } = useBlockedTestCasesQuery(projectID);
  const { t } = useTranslation();
  return (
    <TestCasesTable
      testCases={data?.test_cases ?? []}
      isLoading={isLoading}
      error={error}
      loadingMessage={t("test_cases.loading.blocked")}
      errorMessage={t("test_cases.error.blocked")}
      userMap={userMap}
    />
  );
}

type TestCasesTableProps = {
  testCases: any[];
  isLoading: boolean;
  error: any;
  loadingMessage: string;
  errorMessage: string;
  userMap: Record<number, string>;
};

function TestCasesTable({
  testCases,
  isLoading,
  error,
  loadingMessage,
  errorMessage,
  userMap,
}: TestCasesTableProps) {
  const { t } = useTranslation();
  if (isLoading) return <p>{loadingMessage}</p>;
  if (error) return <p>{errorMessage}</p>;

  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>{t("test_cases.column.code")}</Table.ColumnHeader>
          <Table.ColumnHeader>{t("test_cases.column.title")}</Table.ColumnHeader>
          <Table.ColumnHeader>{t("test_cases.column.status")}</Table.ColumnHeader>
          <Table.ColumnHeader>{t("test_cases.column.result")}</Table.ColumnHeader>
          <Table.ColumnHeader>{t("test_cases.column.executed_by")}</Table.ColumnHeader>
          <Table.ColumnHeader>{t("test_cases.column.notes")}</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {testCases.map((tc: any) => (
          <Table.Row key={tc.id}>
            <Table.Cell>{tc.code}</Table.Cell>
            <Table.Cell>{tc.title}</Table.Cell>
            <Table.Cell>{tc.status}</Table.Cell>
            <Table.Cell>{tc.result}</Table.Cell>
            <Table.Cell>{userMap[tc.executed_by] ?? tc.executed_by}</Table.Cell>
            <Table.Cell>{tc.notes}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}

function SuggestedTestCasesTab({ projectID }: { projectID: string }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useSuggestedTestCasesQuery(projectID);

  const handleApprove = async (id: string) => {
    try {
      await approveSuggestedTestCase(id);
      toaster.success({ title: t("test_cases.approve.success") });
      queryClient.invalidateQueries({
        queryKey: ["get", "/v1/projects/{projectID}/test-cases/suggested"],
      });
      queryClient.invalidateQueries({
        queryKey: ["get", "/v1/projects/{projectID}/test-cases"],
      });
    } catch (err: any) {
      toaster.error({
        title: t("test_cases.approve.error"),
        description: err?.message,
      });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectSuggestedTestCase(id);
      toaster.success({ title: t("test_cases.reject.success") });
      queryClient.invalidateQueries({
        queryKey: ["get", "/v1/projects/{projectID}/test-cases/suggested"],
      });
    } catch (err: any) {
      toaster.error({
        title: t("test_cases.reject.error"),
        description: err?.message,
      });
    }
  };

  if (isLoading) return <p>{t("test_cases.loading.suggested")}</p>;
  if (error) return <p>{t("test_cases.error.suggested")}</p>;

  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>{t("test_cases.column.code")}</Table.ColumnHeader>
          <Table.ColumnHeader>{t("test_cases.column.title")}</Table.ColumnHeader>
          <Table.ColumnHeader>{t("test_cases.column.description")}</Table.ColumnHeader>
          <Table.ColumnHeader>{t("test_cases.column.actions")}</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {(data?.test_cases ?? []).map((tc: any) => (
          <Table.Row key={tc.id}>
            <Table.Cell>{tc.code}</Table.Cell>
            <Table.Cell>{tc.title}</Table.Cell>
            <Table.Cell>{tc.description}</Table.Cell>
            <Table.Cell>
              <Flex gap={2}>
                <Button
                  size="sm"
                  colorPalette="green"
                  onClick={() => handleApprove(String(tc.id))}
                >
                  {t("test_cases.approve")}
                </Button>
                <Button
                  size="sm"
                  colorPalette="red"
                  onClick={() => handleReject(String(tc.id))}
                >
                  {t("test_cases.reject")}
                </Button>
              </Flex>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}