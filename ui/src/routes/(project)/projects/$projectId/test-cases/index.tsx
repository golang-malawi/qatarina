import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Button,
  ButtonGroup,
  Flex,
  Heading,
  IconButton,
  Table,
  Tabs,
} from "@chakra-ui/react";
import {
  IconAlertTriangle,
  IconClock,
  IconList,
  IconListCheck,
  IconListDetails,
  IconTable,
} from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useRef } from "react";
import type { components } from "@/lib/api/v1";
import { Toaster, toaster } from "@/components/ui/toaster";
import { AppDataTable, AppTableColumn } from "@/components/ui/app-data-table";
import {
  TestCaseListQueryParams,
  testCasesByProjectIdQueryOptions,
} from "@/data/queries/test-cases";
import { LuEye, LuPencil } from "react-icons/lu";
import {
  markTestCaseAsDraft,
  useClosedTestCasesQuery,
  useFailingTestCasesQuery,
  useScheduledTestCasesQuery,
  importTestCasesFromFile,
  useBlockedTestCasesQuery,
  useSuggestedTestCasesQuery,
  approveSuggestedTestCase,
  rejectSuggestedTestCase,
} from "@/services/TestCaseService";
import { useUsersQuery } from "@/services/UserService";
import { deleteTestCase } from "@/services/TestCaseService";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-cases/",
)({
  component: ListProjectTestCases,
});

type TestCase = components["schemas"]["schema.TestCaseResponse"];

type TestCaseListResponse =
  components["schemas"]["schema.TestCaseListResponse"];

const columns: AppTableColumn<TestCase>[] = [
  { key: "code", header: "Code", sortKey: "code" },
  { key: "title", header: "Title", sortKey: "title" },
  { key: "kind", header: "Kind", sortKey: "kind" },
  {
    key: "is_draft",
    header: "Draft",
    type: "enum",
    sortKey: "is_draft",
    enumOptions: {
      map: {
        true: { label: "Draft", colorPalette: "orange" },
        false: { label: "Active", colorPalette: "green" },
      },
    },
    align: "center",
    width: "120px",
  },
  {
    key: "created_at",
    header: "Created",
    type: "date",
    sortKey: "created_at",
    align: "end",
    width: "140px",
  },
];

export default function ListProjectTestCases() {
  const { projectId } = Route.useParams();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();

  const markDraftMutation = useMutation({
    mutationFn: async (id: string) => await markTestCaseAsDraft(id),
    onSuccess: () => {
      toaster.create({
        title: "Success",
        description: "Marked as draft",
        type: "success",
      });
      queryClient.invalidateQueries({
        queryKey: ["get", "/v1/projects/{projectID}/test-cases"],
      });
    },
    onError: () => {
      toaster.create({
        title: "Error",
        description: "Failed to mark as draft",
        type: "error",
      });
    },
  });

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
        search,
      }),
      enabled: !!projectId,
    }),
    [projectId],
  );

  const { data: usersData } = useUsersQuery();
  const userMap = Object.fromEntries(
    (usersData?.users ?? []).map((u: any) => [u.id, u.displayName]),
  );

  // const { data: testCases } = useSuspenseQuery(
  //   testCasesByProjectIdQueryOptions(projectId),
  // );

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const response = await importTestCasesFromFile(projectId, file)
      
      const msg = response.message;

      let toastType: "success" | "warning" | "info" = "success";
      let title = "Import result";

      if (msg.startsWith("Imported 0")) {
        toastType = "warning";
        title = "No new test cases imported";
      } else if (msg.includes("skipped") && !msg.startsWith("Imported 0")){
        toastType = "success";
        title = "Imported completed with duplicates";
      } else {
        toastType = "success";
        title = "Import successful";
      }

      toaster.create({
        title,
        description: msg,
        type: toastType,
      });

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

  return (
    <div>
      <Toaster />
      <Heading as="h6" size="xl" color="fg.heading">
        Test Cases
      </Heading>

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
          <Button variant={"outline"} colorPalette="brand" size={"sm"}>
            Add Test Cases
          </Button>
        </Link>
        <Button colorPalette="success" size="sm" onClick={handleImportClick}>
          Import from Excel
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        <Button colorPalette="success" size={"sm"}>
          Import from Google Sheets
        </Button>

        <ButtonGroup>
          <IconButton
            aria-label="List view"
            bg="bg.subtle"
            color="fg.muted"
            size={"sm"}
          >
            <IconListDetails />
          </IconButton>
          <IconButton
            aria-label="Table view"
            bg="bg.emphasized"
            color="fg"
            size={"sm"}
          >
            <IconTable />
          </IconButton>
        </ButtonGroup>
      </Flex>

      <Tabs.Root defaultValue="all">
        <Tabs.List>
          <Tabs.Trigger value="all">
            <IconList />
            &nbsp; All Test Cases
          </Tabs.Trigger>
          <Tabs.Trigger color={"fg.success"} value="completed">
            <IconListCheck />
            &nbsp;Completed / Closed
          </Tabs.Trigger>
          <Tabs.Trigger color={"fg.error"} value="failing">
            <IconAlertTriangle />
            &nbsp;Failing
          </Tabs.Trigger>
          <Tabs.Trigger color={"fg.warning"} value="scheduled">
            <IconClock />
            &nbsp;Scheduled
          </Tabs.Trigger>
          <Tabs.Trigger color={"purple"} value="blocked">
            <IconAlertTriangle />
            &nbsp;Blocked
          </Tabs.Trigger>
          <Tabs.Trigger color={"blue"} value="suggested">
            <IconListDetails />
            &nbsp;Suggested
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="all">
          <AppDataTable<TestCase, TestCaseListResponse>
            // @ts-expect-error TODO(sevenreup)
            query={queryFactory}
            columns={columns}
            defaultSort={{ key: "created_at", desc: true }}
            showGlobalFilter
            filterPlaceholder="Search test cases"
            rowActions={[
              {
                name: "view",
                label: "View",
                icon: LuEye,
                link: (row) =>
                  `/projects/${projectId}/test-cases/${String(row.id ?? "")}`,
              },
              { name: "edit", 
                label: "Edit", 
                icon: LuPencil,
                link: (row) =>
                  `/projects/${projectId}/test-cases/${String(row.id ?? "")}/edit`,
               },
              {
                name: "mark-draft",
                label: "Mark as Draft",
                onClick: (row) =>
                  row.id && markDraftMutation.mutate(String(row.id)),
              },
              { name: "use", label: "Use in Test Session" },
              {
                name: "delete",
                label: "Delete",
                color: "fg.error",
                onClick: async (row) => {
                  if (row.id) {
                    try {
                      await deleteTestCase(String(row.id));
                      toaster.success({ title: "Test case deleted successfully" });
                      queryClient.invalidateQueries(
                        testCasesByProjectIdQueryOptions(projectId)
                      );
                      window.location.href = `/projects/${projectId}/test-cases`;
                    } catch (err: any) {
                      toaster.error({
                        title: "Failed to delete test case",
                        description: err?.message,
                      });
                    }
                  }
                },
              } 
            ]}
          /> 
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
          <SuggestedTestCasesTab projectID={projectId}/>
        </Tabs.Content>
      </Tabs.Root>
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
  return (
    <TestCasesTable
      testCases={data?.test_cases ?? []}
      isLoading={isLoading}
      error={error}
      loadingMessage="Loading closed cases..."
      errorMessage="Failed to load closed test cases"
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
  return (
    <TestCasesTable
      testCases={data?.test_cases ?? []}
      isLoading={isLoading}
      error={error}
      loadingMessage="Loading failing cases..."
      errorMessage="Failed to load failing test cases"
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
  return (
    <TestCasesTable
      testCases={data?.test_cases ?? []}
      isLoading={isLoading}
      error={error}
      loadingMessage="Loading scheduled cases..."
      errorMessage="Failed to load scheduled test cases"
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
  return (
    <TestCasesTable
      testCases={data?.test_cases ?? []}
      isLoading={isLoading}
      error={error}
      loadingMessage="Loading blocked cases..."
      errorMessage="Failed to load blocked test cases"
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
  if (isLoading) return <p>{loadingMessage}</p>;
  if (error) return <p>{errorMessage}</p>;

  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>Code</Table.ColumnHeader>
          <Table.ColumnHeader>Title</Table.ColumnHeader>
          <Table.ColumnHeader>Status</Table.ColumnHeader>
          <Table.ColumnHeader>Result</Table.ColumnHeader>
          <Table.ColumnHeader>Executed By</Table.ColumnHeader>
          <Table.ColumnHeader>Notes</Table.ColumnHeader>
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
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useSuggestedTestCasesQuery(projectID);

  const handleApprove = async (id: string) => {
    try {
      await approveSuggestedTestCase(id);
      toaster.success({ title: "Test case approved" });
      queryClient.invalidateQueries({ queryKey: ["get", "/v1/projects/{projectID}/test-cases/suggested"] });
      queryClient.invalidateQueries({ queryKey: ["get", "/v1/projects/{projectID}/test-cases"] });
    } catch (err: any) {
      toaster.error({ title: "Failed to approve test case", description: err?.message });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectSuggestedTestCase(id);
      toaster.success({ title: "Test case rejected" });
      queryClient.invalidateQueries({ queryKey: ["get", "/v1/projects/{projectID}/test-cases/suggested"] });
    } catch (err: any) {
      toaster.error({ title: "Failed to reject test case", description: err?.message });
    }
  };

  if (isLoading) return <p>Loading suggested cases...</p>;
  if (error) return <p>Failed to load suggested test cases</p>;

  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>Code</Table.ColumnHeader>
          <Table.ColumnHeader>Title</Table.ColumnHeader>
          <Table.ColumnHeader>Description</Table.ColumnHeader> {/* NEW COLUMN */}
          <Table.ColumnHeader>Actions</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {(data?.test_cases ?? []).map((tc: any) => (
          <Table.Row key={tc.id}>
            <Table.Cell>{tc.code}</Table.Cell>
            <Table.Cell>{tc.title}</Table.Cell>
            <Table.Cell>{tc.description}</Table.Cell> {/* SHOW DESCRIPTION */}
            <Table.Cell>
              <Flex gap={2}>
                <Button size="sm" colorPalette="green" onClick={() => handleApprove(String(tc.id))}>
                  Approve
                </Button>
                <Button size="sm" colorPalette="red" onClick={() => handleReject(String(tc.id))}>
                  Reject
                </Button>
              </Flex>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}