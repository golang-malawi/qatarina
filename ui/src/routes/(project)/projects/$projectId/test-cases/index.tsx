import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Button,
  ButtonGroup,
  Dialog,
  Flex,
  Heading,
  IconButton,
  Input,
  Table,
  Tabs,
  Text,
  Checkbox,
  Portal,
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
import React, { useRef, useState } from "react";
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
import {
  parseGitHubUrl,
  listGitHubIssues,
  listGitHubPullRequests,
  importGitHubIssuesAsTestCases,
  importGitHubPullRequestsAsTestCases,
  type GitHubItem,
} from "@/services/GitHubService";

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

  // GitHub import modal state
  const [githubModalOpen, setGithubModalOpen] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [githubItems, setGithubItems] = useState<GitHubItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [filterType, setFilterType] = useState<"all" | "issue" | "pull_request">(
    "all"
  );
  const [isLoadingGitHub, setIsLoadingGitHub] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

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

  const [activeTab, setActiveTab] = useState<
    "all" | "completed" | "failing" | "scheduled" | "blocked" | "suggested"
  >("all");

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

  const handleGitHubConnect = async () => {
    if (!githubUrl.trim()) {
      setGithubError("Please enter a GitHub repository URL");
      return;
    }

    const parsed = parseGitHubUrl(githubUrl);
    if (!parsed) {
      setGithubError("Invalid GitHub URL. Use format: https://github.com/owner/repo");
      return;
    }

    setIsLoadingGitHub(true);
    setGithubError(null);
    setGithubItems([]);
    setSelectedItems(new Set());

    try {
      // Fetch both issues and PRs in parallel
      const [issues, prs] = await Promise.all([
        listGitHubIssues(`${parsed.owner}/${parsed.repo}`),
        listGitHubPullRequests(parsed.owner, parsed.repo),
      ]);

      const combined = [...issues, ...prs];
      setGithubItems(combined);

      if (combined.length === 0) {
        setGithubError("No open issues or pull requests found in this repository.");
      }
    } catch (err: any) {
      setGithubError(
        err?.message || "Failed to fetch GitHub items. Please check the URL and try again."
      );
    } finally {
      setIsLoadingGitHub(false);
    }
  };

  const handleImportGitHub = async () => {
    if (selectedItems.size === 0) {
      toaster.create({
        title: "No items selected",
        description: "Please select at least one issue or pull request to import",
        type: "warning",
      });
      return;
    }

    const parsed = parseGitHubUrl(githubUrl);
    if (!parsed) return;

    setIsImporting(true);

    try {
      const selected = githubItems.filter((item) => selectedItems.has(item.id));
      const issues = selected.filter((item) => item.type === "issue");
      const prs = selected.filter((item) => item.type === "pull_request");

      let importedCount = 0;
      const project = `${parsed.owner}/${parsed.repo}`;

      if (issues.length > 0) {
        const result = await importGitHubIssuesAsTestCases(
          project,
          parseInt(projectId),
          issues.map((item) => item.id)
        );
        importedCount += result.test_cases?.length || 0;
      }

      if (prs.length > 0) {
        const result = await importGitHubPullRequestsAsTestCases(
          project,
          parseInt(projectId),
          prs.map((item) => item.id)
        );
        importedCount += result.test_cases?.length || 0;
      }

      toaster.create({
        title: "Import successful",
        description: `Imported ${importedCount} item(s) as test cases`,
        type: "success",
      });

      // Refresh test case list
      await queryClient.invalidateQueries({
        queryKey: ["get", "/v1/projects/{projectID}/test-cases"],
      });

      // Close modal and reset state
      setGithubModalOpen(false);
      setGithubUrl("");
      setGithubItems([]);
      setSelectedItems(new Set());
      setFilterType("all");
      setGithubError(null);
    } catch (err: any) {
      toaster.create({
        title: "Import failed",
        description: err?.message || "Failed to import from GitHub",
        type: "error",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleSelectItem = (id: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    const filtered = getFilteredItems();
    if (selectedItems.size === filtered.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filtered.map((item) => item.id)));
    }
  };

  const getFilteredItems = () => {
    if (filterType === "all") return githubItems;
    return githubItems.filter((item) => item.type === filterType);
  };

  const filteredItems = getFilteredItems();
  const issueCount = githubItems.filter((item) => item.type === "issue").length;
  const prCount = githubItems.filter((item) => item.type === "pull_request").length;

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

        <Button colorPalette="info" size="sm" onClick={() => setGithubModalOpen(true)}>
          Import from GitHub
        </Button>

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

      {/* GitHub Import Modal */}
      {githubModalOpen && (
        <GitHubImportModal
          isOpen={githubModalOpen}
          onClose={() => setGithubModalOpen(false)}
          githubUrl={githubUrl}
          onUrlChange={setGithubUrl}
          onConnect={handleGitHubConnect}
          isLoading={isLoadingGitHub}
          error={githubError}
          items={githubItems}
          filteredItems={filteredItems}
          filterType={filterType}
          onFilterChange={setFilterType}
          selectedItems={selectedItems}
          onSelectItem={handleSelectItem}
          onSelectAll={handleSelectAll}
          issueCount={issueCount}
          prCount={prCount}
          onImport={handleImportGitHub}
          isImporting={isImporting}
        />
      )}

      <Tabs.Root
        defaultValue="all"
        onValueChange={(details) => setActiveTab(details.value as any)}
      >
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
          {activeTab === "completed" && (
            <ClosedTestCasesTab projectID={projectId} userMap={userMap} />
          )}
        </Tabs.Content>
        <Tabs.Content value="failing">
          {activeTab === "failing" && (
            <FailingTestCasesTab projectID={projectId} userMap={userMap} />
          )}
        </Tabs.Content>
        <Tabs.Content value="scheduled">
          {activeTab === "scheduled" && (
            <ScheduledTestCasesTab projectID={projectId} userMap={userMap} />
          )}
        </Tabs.Content>
        <Tabs.Content value="blocked">
          {activeTab === "blocked" && (
            <BlockedTestCasesTab projectID={projectId} userMap={userMap} />
          )}
        </Tabs.Content>
        <Tabs.Content value="suggested">
          {activeTab === "suggested" && (
            <SuggestedTestCasesTab projectID={projectId} />
          )}
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

interface GitHubImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  githubUrl: string;
  onUrlChange: (url: string) => void;
  onConnect: () => void;
  isLoading: boolean;
  error: string | null;
  items: GitHubItem[];
  filteredItems: GitHubItem[];
  filterType: "all" | "issue" | "pull_request";
  onFilterChange: (type: "all" | "issue" | "pull_request") => void;
  selectedItems: Set<number>;
  onSelectItem: (id: number) => void;
  onSelectAll: () => void;
  issueCount: number;
  prCount: number;
  onImport: () => void;
  isImporting: boolean;
}

function GitHubImportModal({
  isOpen,
  onClose,
  githubUrl,
  onUrlChange,
  onConnect,
  isLoading,
  error,
  items,
  filteredItems,
  filterType,
  onFilterChange,
  selectedItems,
  onSelectItem,
  onSelectAll,
  issueCount,
  prCount,
  onImport,
  isImporting,
}: GitHubImportModalProps) {
  const allFiltered = filteredItems.length;
  const allSelected = selectedItems.size;

  return (
      <Dialog.Root
        open={isOpen}
        onOpenChange={(openState: any) => {
          if (typeof openState === "boolean") {
            if (!openState) onClose();
          } else if (openState?.open === false) {
            onClose();
          }
        }}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content bg="bg.surface" border="sm" borderColor="border.subtle" maxW="3xl">
              <Dialog.Header>
                <Dialog.Title>Import from GitHub</Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <Button variant="ghost" size="sm">Close</Button>
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body>
          {items.length === 0 ? (
            <Flex direction="column" gap={4}>
              <div>
                <label htmlFor="github-url" style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                  GitHub Repository URL
                </label>
                <Input
                  id="github-url"
                  placeholder="https://github.com/owner/repo"
                  value={githubUrl}
                  onChange={(e) => onUrlChange(e.target.value)}
                  disabled={isLoading}
                />
                <Text fontSize="sm" color="fg.muted" mt={1}>
                  Paste the full GitHub repository URL
                </Text>
              </div>

              {error && (
                <div style={{ padding: "8px", backgroundColor: "#fee", borderRadius: "4px", color: "#c00" }}>
                  <Text fontSize="sm">{error}</Text>
                </div>
              )}

              <Button
                colorPalette="info"
                onClick={onConnect}
                disabled={!githubUrl.trim() || isLoading}
                loading={isLoading}
              >
                {isLoading ? "Connecting..." : "Connect & Load Issues/PRs"}
              </Button>
            </Flex>
          ) : (
            <Flex direction="column" gap={4}>
              <div>
                <Flex justify="space-between" align="center" mb={2}>
                  <Heading size="sm">Select Items to Import</Heading>
                  <Text fontSize="sm" color="fg.muted">
                    {issueCount} issue{issueCount !== 1 ? "s" : ""}, {prCount} PR
                    {prCount !== 1 ? "s" : ""}
                  </Text>
                </Flex>

                {/* Filter buttons */}
                <Flex gap={2} mb={4}>
                  <Button
                    size="sm"
                    variant={filterType === "all" ? "solid" : "outline"}
                    colorPalette={filterType === "all" ? "info" : "gray"}
                    onClick={() => onFilterChange("all")}
                  >
                    All ({items.length})
                  </Button>
                  <Button
                    size="sm"
                    variant={filterType === "issue" ? "solid" : "outline"}
                    colorPalette={filterType === "issue" ? "info" : "gray"}
                    onClick={() => onFilterChange("issue")}
                  >
                    Issues ({issueCount})
                  </Button>
                  <Button
                    size="sm"
                    variant={filterType === "pull_request" ? "solid" : "outline"}
                    colorPalette={filterType === "pull_request" ? "info" : "gray"}
                    onClick={() => onFilterChange("pull_request")}
                  >
                    Pull Requests ({prCount})
                  </Button>
                </Flex>
              </div>

              {error && (
                <div style={{ padding: "8px", backgroundColor: "#fee", borderRadius: "4px", color: "#c00" }}>
                  <Text fontSize="sm">{error}</Text>
                </div>
              )}

              {/* Items table */}
              <div style={{ maxHeight: "400px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "4px" }}>
                <Table.Root>
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader width="50px">
                        <Checkbox.Root
                          checked={allSelected === allFiltered && allFiltered > 0}
                          onCheckedChange={() => onSelectAll()}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                        </Checkbox.Root>
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>Type</Table.ColumnHeader>
                      <Table.ColumnHeader flex="1">Title</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {filteredItems.length > 0 ? (
                      filteredItems.map((item) => (
                        <Table.Row key={item.id}>
                          <Table.Cell width="50px">
                            <Checkbox.Root
                              checked={selectedItems.has(item.id)}
                              onCheckedChange={() => onSelectItem(item.id)}
                            >
                              <Checkbox.HiddenInput />
                              <Checkbox.Control />
                            </Checkbox.Root>
                          </Table.Cell>
                          <Table.Cell width="80px">
                            <Text fontSize="sm" color="fg.muted">
                              {item.type === "issue" ? "Issue" : "PR"}
                            </Text>
                          </Table.Cell>
                          <Table.Cell flex="1">
                            <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: "#0066cc" }}>
                              {item.title}
                            </a>
                          </Table.Cell>
                        </Table.Row>
                      ))
                    ) : (
                      <Table.Row>
                        <Table.Cell colSpan={3}>
                          <Text fontSize="sm" color="fg.muted" textAlign="center" py={4}>
                            No items found
                          </Text>
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Body>
                </Table.Root>
              </div>

              <Text fontSize="sm" color="fg.muted">
                Selected: {allSelected} of {allFiltered} item{allFiltered !== 1 ? "s" : ""}
              </Text>
            </Flex>
          )}
        </Dialog.Body>
        <Dialog.Footer>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {items.length > 0 && (
            <Button
              colorPalette="success"
              onClick={onImport}
              disabled={selectedItems.size === 0 || isImporting}
              loading={isImporting}
            >
              {isImporting ? "Importing..." : `Import ${selectedItems.size} Item${selectedItems.size !== 1 ? "s" : ""}`}
            </Button>
          )}
        </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
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