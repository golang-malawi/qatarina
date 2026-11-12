import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
  Box,
  Flex,
  Heading,
  Button,
  Table,
  Textarea,
  Text,
  Badge,
  Spinner,
  Wrap,
  WrapItem,
  Separator,
  Input,
} from "@chakra-ui/react";
import { Checkbox } from "@/components/ui/checkbox";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { components } from "@/lib/api/v1";
import {
  queryOptions,
  useMutation,
  useInfiniteQuery,
  useQueries,
  useQueryClient,
} from "@tanstack/react-query";
import {
  findTestCaseInboxQueryOptions,
  findTestCaseSummaryQueryOptions,
} from "@/data/queries/test-cases";
import {
  createTestRun,
  executeTestRun,
  uploadTestRunAttachment,
} from "@/services/TestRunService";
import { IconPaperclip, IconX } from "@tabler/icons-react";
import { toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/isLoggedIn";
import { apiClient } from "@/lib/api/query";
import { getInboxTestCases } from "@/services/TestCaseService";
import { MarkdownChecklist } from "@/components/MarkdownChecklist";
import { PriorityBadge } from "@/components/PriorityBadge";
import { normalizePriority, PRIORITY_OPTIONS } from "@/common/constants/priority";
import {
  applyChecklistState,
  readChecklistState,
  resetChecklistState,
  useChecklistState,
} from "@/lib/markdown-checklist";
import {
  descriptionChecklistKey,
  preconditionsChecklistKey,
} from "@/lib/preconditions-checklist";
import { useTranslation } from "react-i18next";

// Runs for a test plan; shared by every row from the same plan
const testRunsByPlanQueryOptions = (testPlanId: number) =>
  queryOptions({
    queryKey: ["testRuns", testPlanId],
    queryFn: async () => {
      const res = await (apiClient.GET as any)("/v1/test-plans/{testPlanID}/test-runs", {
        params: { path: { testPlanID: testPlanId.toString() } },
      });
      if (res.error) throw new Error("Failed to fetch test runs");
      return res.data;
    },
  });

const lastResultKey = (testPlanId?: number, testCaseId?: string) =>
  `${testPlanId ?? ""}:${testCaseId ?? ""}`;

// Filter values for the per-column filter row; empty string means "any"
type ColumnFilters = {
  code: string;
  title: string;
  preconditions: string;
  project: string;
  environment: string;
  priority: string;
  urgency: string;
  lastResult: string;
};

const emptyColumnFilters: ColumnFilters = {
  code: "",
  title: "",
  preconditions: "",
  project: "",
  environment: "",
  priority: "",
  urgency: "",
  lastResult: "",
};

type AssignedTestCase = components["schemas"]["schema.AssignedTestCase"];

// Same file types the inbox test case view accepts
const ATTACHMENT_ACCEPT = ".txt,.md,.pdf,.docx,.jpg,.jpeg,.png,.svg";

// Drafts can't be tested yet and closed test cases no longer accept results,
// same as the inbox test case view
const isLocked = (tc: AssignedTestCase) => Boolean(tc.is_draft || tc.is_closed);

// Tickable markdown checklist whose ticks are shared with the inbox test case view
function SharedChecklist({
  storageKey,
  markdown,
  readOnly,
  itemLabel,
}: {
  storageKey: string;
  markdown: string;
  readOnly?: boolean;
  itemLabel?: string;
}) {
  const checklist = useChecklistState(storageKey, markdown);
  return (
    <MarkdownChecklist
      markdown={markdown}
      checked={checklist.checked}
      onToggle={readOnly ? undefined : checklist.toggle}
      onReset={checklist.reset}
      itemLabel={itemLabel}
    />
  );
}

// Sentinel option values for rows with no environment / no run yet
const NOT_SPECIFIED = "__none__";
const NO_RUN = "__no_run__";

const filterSelectStyle: React.CSSProperties = {
  width: "100%",
  padding: "2px 4px",
  borderRadius: "2px",
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  fontSize: "12px",
  fontWeight: "normal",
};

interface SheetViewProps {
  projectMap: Record<number, string>;
  environmentMap: Record<number, string>;
  onBackToStandard: () => void;
  includeClosed: boolean;
}

export function SheetView({
  projectMap,
  environmentMap,
  onBackToStandard,
  includeClosed: initialIncludeClosed,
}: SheetViewProps) {
  const { t } = useTranslation();
  const [includeClosed, setIncludeClosed] = useState(initialIncludeClosed);
  const [moduleFilter, setModuleFilter] = useState<string>("");
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>(emptyColumnFilters);
  const setColumnFilter = (key: keyof ColumnFilters, value: string) =>
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
  const [sheetStatuses, setSheetStatuses] = useState<Record<string, "passed" | "failed">>({});
  const [sheetNotes, setSheetNotes] = useState<Record<string, string>>({});
  const [sheetAttachments, setSheetAttachments] = useState<Record<string, File[]>>({});
  const setRowAttachments = (testCaseId: string, files: File[]) =>
    setSheetAttachments((prev) => ({ ...prev, [testCaseId]: files }));
  const [selectedTestCaseForDetails, setSelectedTestCaseForDetails] =
    useState<components["schemas"]["schema.AssignedTestCase"] | null>(null);

  const queryClient = useQueryClient();
  const auth = useAuth();
  const currentUser = auth.user;

  const pageSize = 20;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    error,
  } = useInfiniteQuery({
    queryKey: ["me-test-cases-inbox", includeClosed],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await getInboxTestCases({
        includeClosed,
        page: pageParam,
        pageSize,
      });
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const total = lastPage?.pagination?.total ?? 0;
      const loadedCount = allPages.reduce(
        (acc, page) => acc + (page?.test_cases?.length ?? 0),
        0
      );
      return loadedCount < total ? allPages.length + 1 : undefined;
    },
  });

  const testCases = useMemo(
    () => data?.pages.flatMap((page: any) => page?.test_cases ?? []) ?? [],
    [data]
  );

  // Last result per test case, looked up here (not per row) so it can be filtered on
  const testPlanIds = useMemo(
    () =>
      Array.from(
        new Set(
          testCases
            .map((tc) => tc.test_plan_id)
            .filter((id): id is number => Boolean(id)),
        ),
      ),
    [testCases],
  );
  const testRunsQueries = useQueries({
    queries: testPlanIds.map((id) => testRunsByPlanQueryOptions(id)),
  });
  const lastResultByTestCase = useMemo(() => {
    const map: Record<string, string> = {};
    testRunsQueries.forEach((query, idx) => {
      const runs = (query.data as any)?.test_runs ?? [];
      runs.forEach((r: any) => {
        const key = lastResultKey(testPlanIds[idx], r.test_case_id);
        // Keep the first run listed for a test case, as the row did before
        if (!(key in map)) map[key] = r.result_state ?? "";
      });
    });
    return map;
  }, [testRunsQueries, testPlanIds]);

  // Derive module options from loaded test cases
  const moduleOptions = useMemo(() => {
    return Array.from(
      new Set(testCases.map((tc) => (tc as any)?.feature_or_module).filter(Boolean))
    ).map((v) => ({ label: v as string, value: v as string }));
  }, [testCases]);

  // Options for the column filters, built from the test cases loaded so far
  const projectFilterOptions = useMemo(
    () =>
      Array.from(new Set(testCases.map((tc) => tc.project_id).filter(Boolean))).map((id) => ({
        value: String(id),
        label: projectMap[id as number] ?? `Project ${id}`,
      })),
    [testCases, projectMap],
  );

  const environmentFilterOptions = useMemo(() => {
    const ids = Array.from(new Set(testCases.map((tc) => tc.environment_id).filter(Boolean)));
    const options = ids.map((id) => ({
      value: String(id),
      label: environmentMap[id as number] ?? `Environment ${id}`,
    }));
    if (testCases.some((tc) => !tc.environment_id)) {
      options.push({
        value: NOT_SPECIFIED,
        label: t("test_cases.sheet_view.not_specified", "Not specified"),
      });
    }
    return options;
  }, [testCases, environmentMap, t]);

  const lastResultOf = useCallback(
    (tc: components["schemas"]["schema.AssignedTestCase"]) =>
      lastResultByTestCase[lastResultKey(tc.test_plan_id, tc.id)] || "",
    [lastResultByTestCase],
  );

  const lastResultFilterOptions = useMemo(() => {
    const states = Array.from(
      new Set(testCases.map((tc) => lastResultOf(tc).toLowerCase()).filter(Boolean)),
    );
    const options = states.map((state) => ({ value: state, label: state.toUpperCase() }));
    if (testCases.some((tc) => !lastResultOf(tc))) {
      options.push({ value: NO_RUN, label: t("test_cases.sheet_view.no_run", "NO RUN") });
    }
    return options;
  }, [testCases, lastResultOf, t]);

  // Apply the module and column filters client-side
  const filteredTestCases = useMemo(() => {
    const code = columnFilters.code.trim().toLowerCase();
    const title = columnFilters.title.trim().toLowerCase();
    const preconditions = columnFilters.preconditions.trim().toLowerCase();

    return testCases.filter((tc) => {
      if (moduleFilter && tc.feature_or_module !== moduleFilter) return false;
      if (code && !(tc.code || `#${tc.id}`).toLowerCase().includes(code)) return false;
      if (title && !(tc.title ?? "").toLowerCase().includes(title)) return false;
      if (preconditions && !(tc.preconditions ?? "").toLowerCase().includes(preconditions)) {
        return false;
      }
      if (columnFilters.priority && normalizePriority(tc.priority) !== columnFilters.priority) {
        return false;
      }
      if (columnFilters.urgency && normalizePriority(tc.urgency) !== columnFilters.urgency) {
        return false;
      }
      if (columnFilters.project && String(tc.project_id) !== columnFilters.project) return false;
      if (columnFilters.environment) {
        const env = tc.environment_id ? String(tc.environment_id) : NOT_SPECIFIED;
        if (env !== columnFilters.environment) return false;
      }
      if (columnFilters.lastResult) {
        const result = lastResultOf(tc).toLowerCase() || NO_RUN;
        if (result !== columnFilters.lastResult) return false;
      }
      return true;
    });
  }, [testCases, moduleFilter, columnFilters, lastResultOf]);

  const isFiltering =
    Boolean(moduleFilter) || Object.values(columnFilters).some((v) => v.trim() !== "");
  const totalTestCases = data?.pages[0]?.pagination?.total ?? testCases.length;

  const clearFilters = () => {
    setModuleFilter("");
    setColumnFilters(emptyColumnFilters);
  };

  // Rows load page by page as you scroll. While filtering, load the rest so the
  // filter covers the whole inbox and not just the rows scrolled in so far.
  useEffect(() => {
    if (isFiltering && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isFiltering, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Infinite scroll observer
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback(
    (node: HTMLTableRowElement | null) => {
      if (isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  // Mutation for recording results
  const executeSheetMutation = useMutation({
    mutationFn: async ({
      tc,
      status,
    }: {
      tc: components["schemas"]["schema.AssignedTestCase"];
      status: "passed" | "failed";
    }) => {
      const resText = t("test_cases.sheet_view.executed_via", "Executed via Sheet View");
      const noteText = sheetNotes[tc.id!] || "";

      if (!tc.id) throw new Error("Test case ID is missing.");
      if (isLocked(tc)) throw new Error("Draft and closed test cases can't be recorded.");
      if (!currentUser?.user_id) throw new Error("User ID is missing.");
      if (!tc.project_id || !tc.test_plan_id) {
        throw new Error("Project ID or Test Plan ID is missing.");
      }

      const run = await createTestRun({
        test_case_id: tc.id,
        test_plan_id: tc.test_plan_id,
        project_id: tc.project_id,
        owner_id: currentUser.user_id,
        tested_by_id: currentUser.user_id,
        assigned_to_id: currentUser.user_id,
      });

      if (!run?.id) throw new Error("Run ID is missing.");

      const response = await executeTestRun(run.id, {
        test_run_id: run.id,
        result_state: status,
        actual_result: resText,
        notes: noteText,
        // snapshot of the description with the steps the tester ticked, as the inbox view does
        expected_result: tc.description
          ? applyChecklistState(
              tc.description,
              readChecklistState(descriptionChecklistKey(currentUser.user_id, tc.id), tc.description),
            )
          : tc.description,
        environment_id: tc.environment_id,
        tested_on: new Date().toISOString(),
        is_closed: false,
      });

      // Upload attachments once the result exists. The result is already saved at this
      // point, so report failed uploads separately instead of failing the whole record.
      const files = sheetAttachments[tc.id] ?? [];
      const failedUploads: string[] = [];
      if (files.length > 0) {
        const resultId = response.data?.result_id;
        for (const file of files) {
          try {
            if (!resultId) throw new Error("Missing result_id");
            await uploadTestRunAttachment(resultId, file);
          } catch {
            failedUploads.push(file.name);
          }
        }
      }

      return { failedUploads };
    },
    onSuccess: ({ failedUploads }, variables) => {
      toaster.create({
        title: t("test_cases.toast.success", "Success"),
        description: t("test_cases.sheet_view.toast.success_desc", "Test result recorded via Sheet View"),
        type: "success",
      });
      if (failedUploads.length > 0) {
        toaster.create({
          title: t("test_cases.sheet_view.toast.attachments_failed", "Some attachments were not uploaded"),
          description: failedUploads.join(", "),
          type: "warning",
        });
      }
      if (variables.tc.id) {
        setRowAttachments(variables.tc.id, []);
      }
      queryClient.invalidateQueries(findTestCaseInboxQueryOptions(false));
      queryClient.invalidateQueries(findTestCaseSummaryQueryOptions);
      // Clear the ticked steps for the next run, as the inbox view does
      if (variables.tc.id) {
        resetChecklistState(descriptionChecklistKey(currentUser?.user_id, variables.tc.id));
      }
      if (variables.tc.test_plan_id) {
        queryClient.invalidateQueries({ queryKey: ["testRuns", variables.tc.test_plan_id] });
      }
    },
    onError: () => {
      toaster.create({
        title: t("test_cases.toast.error", "Error"),
        description: t("test_cases.sheet_view.toast.error_desc", "Failed to record test result"),
        type: "error",
      });
    },
  });

  if (isPending) {
    return (
      <Flex justify="center" align="center" h="full" w="full">
        <Spinner size="xl" color="brand.solid" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Box p={6} textAlign="center" color="fg.error">
        {t("test_cases.sheet_view.error_loading", "Error loading sheet view test cases.")}
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" h="full" w="full" p={0} m={0}>
      {/* Header bar with actions and filters */}
      <Flex justify="space-between" align="center" mb={2} px={2} pt={1} flexShrink={0} wrap="wrap" gap={2}>
        <Flex align="center" gap={4}>
          <Heading size="md" color="fg.heading">
            {t("test_cases.sheet_view.title", "Test Case Sheet View")}
          </Heading>
          
          <Checkbox
            checked={includeClosed}
            onCheckedChange={(e) => setIncludeClosed(e.checked as boolean)}
          >
            {t("test_cases.show_closed", "Show closed test cases")}
          </Checkbox>

          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            style={{
              padding: "4px 8px",
              borderRadius: "4px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              fontSize: "13px",
            }}
          >
            <option value="">{t("common.all", "All")}</option>
            {moduleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {isFiltering && (
            <Flex align="center" gap={2}>
              <Text fontSize="xs" color="fg.muted">
                {t("test_cases.sheet_view.filter.showing", "Showing {{shown}} of {{total}}", {
                  shown: filteredTestCases.length,
                  total: totalTestCases,
                })}
                {hasNextPage &&
                  ` ${t("test_cases.sheet_view.filter.loading_rest", "(loading the rest...)")}`}
              </Text>
              <Button size="xs" variant="ghost" colorPalette="brand" onClick={clearFilters}>
                {t("test_cases.sheet_view.filter.clear", "Clear filters")}
              </Button>
            </Flex>
          )}
        </Flex>

        <Button
          size="xs"
          variant="outline"
          colorPalette="brand"
          onClick={onBackToStandard}
        >
          {t("test_cases.sheet_view.back_to_standard", "Back to Standard View")}
        </Button>
      </Flex>

      <Box flex="1" overflowY="auto" borderTop="1px solid" borderBottom="1px solid" borderColor="gray.300" bg="white" w="full">
        <Table.Root size="sm" variant="outline" css={{ borderCollapse: "collapse", tableLayout: "fixed", width: "100%" }}>
          <Table.Header position="sticky" top={0} zIndex={1} bg="gray.100">
            <Table.Row>
              <Table.ColumnHeader width="6%">{t("test_cases.column.code", "Code")}</Table.ColumnHeader>
              <Table.ColumnHeader width="12%">{t("test_cases.column.title", "Title")}</Table.ColumnHeader>
              <Table.ColumnHeader width="16%">{t("test_cases.column.preconditions", "Preconditions")}</Table.ColumnHeader>
              <Table.ColumnHeader width="8%">{t("test_cases.column.project", "Project")}</Table.ColumnHeader>
              <Table.ColumnHeader width="8%">{t("test_cases.column.environment", "Environment")}</Table.ColumnHeader>
              <Table.ColumnHeader width="6%">{t("test_cases.column.priority", "Priority")}</Table.ColumnHeader>
              <Table.ColumnHeader width="6%">{t("test_cases.column.urgency", "Urgency")}</Table.ColumnHeader>
              <Table.ColumnHeader width="7%">{t("test_cases.column.last_result", "Last Result")}</Table.ColumnHeader>
              <Table.ColumnHeader width="8%">{t("test_cases.column.status", "Status")}</Table.ColumnHeader>
              <Table.ColumnHeader width="15%">{t("test_cases.column.comments", "Comments")}</Table.ColumnHeader>
              <Table.ColumnHeader width="8%" textAlign="center">{t("test_cases.column.actions", "Action")}</Table.ColumnHeader>
            </Table.Row>
            {/* Per-column filters */}
            <Table.Row>
              <Table.ColumnHeader py={1} px={1}>
                <Input
                  size="xs"
                  bg="white"
                  placeholder={t("test_cases.sheet_view.filter.contains", "Contains...")}
                  aria-label={t("test_cases.sheet_view.filter.code", "Filter by code")}
                  value={columnFilters.code}
                  onChange={(e) => setColumnFilter("code", e.target.value)}
                />
              </Table.ColumnHeader>
              <Table.ColumnHeader py={1} px={1}>
                <Input
                  size="xs"
                  bg="white"
                  placeholder={t("test_cases.sheet_view.filter.contains", "Contains...")}
                  aria-label={t("test_cases.sheet_view.filter.title", "Filter by title")}
                  value={columnFilters.title}
                  onChange={(e) => setColumnFilter("title", e.target.value)}
                />
              </Table.ColumnHeader>
              <Table.ColumnHeader py={1} px={1}>
                <Input
                  size="xs"
                  bg="white"
                  placeholder={t("test_cases.sheet_view.filter.contains", "Contains...")}
                  aria-label={t("test_cases.sheet_view.filter.preconditions", "Filter by preconditions")}
                  value={columnFilters.preconditions}
                  onChange={(e) => setColumnFilter("preconditions", e.target.value)}
                />
              </Table.ColumnHeader>
              <Table.ColumnHeader py={1} px={1}>
                <select
                  style={filterSelectStyle}
                  aria-label={t("test_cases.sheet_view.filter.project", "Filter by project")}
                  value={columnFilters.project}
                  onChange={(e) => setColumnFilter("project", e.target.value)}
                >
                  <option value="">{t("common.all", "All")}</option>
                  {projectFilterOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Table.ColumnHeader>
              <Table.ColumnHeader py={1} px={1}>
                <select
                  style={filterSelectStyle}
                  aria-label={t("test_cases.sheet_view.filter.environment", "Filter by environment")}
                  value={columnFilters.environment}
                  onChange={(e) => setColumnFilter("environment", e.target.value)}
                >
                  <option value="">{t("common.all", "All")}</option>
                  {environmentFilterOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Table.ColumnHeader>
              <Table.ColumnHeader py={1} px={1}>
                <select
                  style={filterSelectStyle}
                  aria-label={t("test_cases.sheet_view.filter.priority", "Filter by priority")}
                  value={columnFilters.priority}
                  onChange={(e) => setColumnFilter("priority", e.target.value)}
                >
                  <option value="">{t("common.all", "All")}</option>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Table.ColumnHeader>
              <Table.ColumnHeader py={1} px={1}>
                <select
                  style={filterSelectStyle}
                  aria-label={t("test_cases.sheet_view.filter.urgency", "Filter by urgency")}
                  value={columnFilters.urgency}
                  onChange={(e) => setColumnFilter("urgency", e.target.value)}
                >
                  <option value="">{t("common.all", "All")}</option>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Table.ColumnHeader>
              <Table.ColumnHeader py={1} px={1}>
                <select
                  style={filterSelectStyle}
                  aria-label={t("test_cases.sheet_view.filter.last_result", "Filter by last result")}
                  value={columnFilters.lastResult}
                  onChange={(e) => setColumnFilter("lastResult", e.target.value)}
                >
                  <option value="">{t("common.all", "All")}</option>
                  {lastResultFilterOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Table.ColumnHeader>
              {/* Status, Comments and Action are inputs, not data, so they are not filterable */}
              <Table.ColumnHeader colSpan={3} />
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {filteredTestCases.length > 0 ? (
              filteredTestCases.map((tc, index) => {
                const isLast = index === filteredTestCases.length - 1;
                const rowBg = index % 2 === 0 ? "white" : "gray.50";
                return (
                  <TestCaseRow
                    key={tc.id}
                    ref={isLast ? lastElementRef : null}
                    tc={tc}
                    rowBg={rowBg}
                    lastResultState={lastResultByTestCase[lastResultKey(tc.test_plan_id, tc.id)]}
                    userId={currentUser?.user_id}
                    projectMap={projectMap}
                    environmentMap={environmentMap}
                    sheetStatuses={sheetStatuses}
                    setSheetStatuses={setSheetStatuses}
                    sheetNotes={sheetNotes}
                    setSheetNotes={setSheetNotes}
                    attachments={sheetAttachments[tc.id ?? ""] ?? []}
                    onAttachmentsChange={(files) => tc.id && setRowAttachments(tc.id, files)}
                    onViewDetails={() => setSelectedTestCaseForDetails(tc)}
                    executeMutation={executeSheetMutation}
                  />
                );
              })
            ) : (
              <Table.Row>
                <Table.Cell colSpan={11} textAlign="center" color="gray.500" py={6}>
                  {isFiltering
                    ? t("test_cases.sheet_view.filter.no_matches", "No test cases match the filters.")
                    : t("test_cases.sheet_view.empty", "No test cases found.")}
                </Table.Cell>
              </Table.Row>
            )}

            {isFetchingNextPage && (
              <Table.Row>
                <Table.Cell colSpan={11} textAlign="center" py={3} color="gray.500" fontSize="xs">
                  {t("test_cases.sheet_view.loading_more", "Loading more test cases...")}
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Box>

      {/* Drawer for details */}
      {selectedTestCaseForDetails && (
        <Box
          position="fixed"
          top={0}
          left={0}
          w="100vw"
          h="100vh"
          zIndex={1000}
          display="flex"
          justifyContent="flex-end"
          bg="blackAlpha.500"
          onClick={() => setSelectedTestCaseForDetails(null)}
        >
          <Box
            w="480px"
            bg="white"
            h="full"
            p={6}
            boxShadow="xl"
            overflowY="auto"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            display="flex"
            flexDirection="column"
            gap={4}
          >
            <Flex justify="space-between" align="center">
              <Heading size="sm">{t("test_cases.sheet_view.details_title", "Test Case Details")}</Heading>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => setSelectedTestCaseForDetails(null)}
              >
                ✕
              </Button>
            </Flex>

            {/* Code & Title Header */}
            <Box>
              <Flex align="center" gap={2} mb={1}>
                {selectedTestCaseForDetails.code && (
                  <Badge variant="outline" colorPalette="gray" size="sm">
                    {selectedTestCaseForDetails.code}
                  </Badge>
                )}
                {(selectedTestCaseForDetails as any).kind && (
                  <Badge variant="solid" colorPalette="purple" size="sm">
                    {(selectedTestCaseForDetails as any).kind}
                  </Badge>
                )}
              </Flex>
              <Text fontWeight="semibold" fontSize="md" color="gray.800">
                {selectedTestCaseForDetails.title}
              </Text>
            </Box>

            <Separator />

            {/* Metadata Properties Grid */}
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={3}>
              <Box>
                <Text fontWeight="bold" fontSize="xs" color="gray.500">
                  {t("test_cases.column.project", "PROJECT").toUpperCase()}
                </Text>
                <Text fontSize="sm" color="gray.700">
                  {projectMap[selectedTestCaseForDetails.project_id ?? -1] ?? t("common.unknown", "Unknown")}
                </Text>
              </Box>

              <Box>
                <Text fontWeight="bold" fontSize="xs" color="gray.500">
                  {t("test_cases.column.environment", "ENVIRONMENT").toUpperCase()}
                </Text>
                <Text fontSize="sm" color="gray.700">
                  {selectedTestCaseForDetails.environment_id && environmentMap[selectedTestCaseForDetails.environment_id]
                    ? environmentMap[selectedTestCaseForDetails.environment_id]
                    : t("test_cases.sheet_view.not_specified", "Not specified")}
                </Text>
              </Box>

              {(selectedTestCaseForDetails as any).status && (
                <Box>
                  <Text fontWeight="bold" fontSize="xs" color="gray.500">
                    {t("test_cases.column.status", "STATUS").toUpperCase()}
                  </Text>
                  <Badge variant="subtle" colorPalette="blue" size="xs">
                    {(selectedTestCaseForDetails as any).status}
                  </Badge>
                </Box>
              )}

              {(selectedTestCaseForDetails as any).priority && (
                <Box>
                  <Text fontWeight="bold" fontSize="xs" color="gray.500">
                    {t("test_cases.column.priority", "PRIORITY").toUpperCase()}
                  </Text>
                  <Badge variant="subtle" colorPalette="orange" size="xs">
                    {(selectedTestCaseForDetails as any).priority}
                  </Badge>
                </Box>
              )}
            </Box>

            {/* Tags */}
            {((selectedTestCaseForDetails as any).tags?.length ?? 0) > 0 && (
              <Box>
                <Text fontWeight="bold" fontSize="xs" color="gray.500" mb={1}>
                  {t("test_cases.details.tags", "TAGS")}
                </Text>
                <Wrap gap={1}>
                  {(selectedTestCaseForDetails as any).tags.map((tag: string, idx: number) => (
                    <WrapItem key={idx}>
                      <Badge variant="subtle" colorPalette="teal" size="xs">
                        {tag}
                      </Badge>
                    </WrapItem>
                  ))}
                </Wrap>
              </Box>
            )}

            <Separator />

            {/* Preconditions with Markdown Support */}
            {selectedTestCaseForDetails.preconditions && (
              <Box>
                <Text fontWeight="bold" fontSize="xs" color="gray.500" mb={1}>
                  {t("test_cases.details.preconditions", "PRECONDITIONS")}
                </Text>
                <Box color="gray.700" fontSize="sm">
                  <SharedChecklist
                    storageKey={preconditionsChecklistKey(
                      currentUser?.user_id,
                      selectedTestCaseForDetails.id ?? "",
                    )}
                    markdown={selectedTestCaseForDetails.preconditions}
                    readOnly={isLocked(selectedTestCaseForDetails)}
                    itemLabel="preconditions"
                  />
                </Box>
              </Box>
            )}

            {/* Description & Steps with Markdown Support */}
            <Box flex="1">
              <Text fontWeight="bold" fontSize="xs" color="gray.500" mb={1}>
                {t("test_cases.sheet_view.description_and_steps", "DESCRIPTION & STEPS")}
              </Text>
              {selectedTestCaseForDetails.description ? (
                <Box color="gray.700" fontSize="sm">
                  <SharedChecklist
                    storageKey={descriptionChecklistKey(
                      currentUser?.user_id,
                      selectedTestCaseForDetails.id ?? "",
                    )}
                    markdown={selectedTestCaseForDetails.description}
                    readOnly={isLocked(selectedTestCaseForDetails)}
                  />
                </Box>
              ) : (
                <Text fontSize="sm" color="gray.500">
                  {t("test_cases.sheet_view.no_steps", "No detailed steps provided.")}
                </Text>
              )}
            </Box>

            {/* Expected Result with Markdown Support */}
            {(selectedTestCaseForDetails as any).expected_result && (
              <Box>
                <Text fontWeight="bold" fontSize="xs" color="gray.500" mb={1}>
                  {t("test_cases.details.expected_result", "EXPECTED RESULT")}
                </Text>
                <Box color="gray.700" fontSize="sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {(selectedTestCaseForDetails as any).expected_result}
                  </ReactMarkdown>
                </Box>
              </Box>
            )}

            <Button
              size="sm"
              variant="outline"
              mt="auto"
              onClick={() => setSelectedTestCaseForDetails(null)}
            >
              {t("test_cases.sheet_view.close", "Close")}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}

// ---------------------------------------------
// A single editable sheet row
// ---------------------------------------------
interface TestCaseRowProps {
  tc: components["schemas"]["schema.AssignedTestCase"];
  rowBg: string;
  lastResultState?: string;
  userId?: number;
  projectMap: Record<number, string>;
  environmentMap: Record<number, string>;
  sheetStatuses: Record<string, "passed" | "failed">;
  setSheetStatuses: React.Dispatch<React.SetStateAction<Record<string, "passed" | "failed">>>;
  sheetNotes: Record<string, string>;
  setSheetNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  attachments: File[];
  onAttachmentsChange: (files: File[]) => void;
  onViewDetails: () => void;
  executeMutation: any;
}

const TestCaseRow = React.forwardRef<HTMLTableRowElement, TestCaseRowProps>(
  function TestCaseRow(
    {
      tc,
      rowBg,
      lastResultState,
      userId,
      projectMap,
      environmentMap,
      sheetStatuses,
      setSheetStatuses,
      sheetNotes,
      setSheetNotes,
      attachments,
      onAttachmentsChange,
      onViewDetails,
      executeMutation,
    },
    ref
  ) {
    const { t } = useTranslation();
    const locked = isLocked(tc);
    const attachmentInputRef = useRef<HTMLInputElement | null>(null);
    const lockedReason = tc.is_closed
      ? t("test_cases.sheet_view.locked_closed", "This test case is closed. Results can no longer be recorded.")
      : t("test_cases.sheet_view.locked_draft", "Draft test cases can't be recorded until unmarked as draft.");

    return (
      <Table.Row ref={ref} bg={rowBg} _hover={{ bg: "blue.50" }} opacity={tc.is_closed ? 0.5 : 1}>
        {/* Code Column */}
        <Table.Cell border="1px solid" borderColor="gray.200" py={1} px={2}>
          <Text fontWeight="medium" fontSize="xs" truncate title={tc.code || `#${tc.id}`}>
            {tc.code || `#${tc.id}`}
          </Text>
        </Table.Cell>

        {/* Title Column */}
        <Table.Cell border="1px solid" borderColor="gray.200" py={1} px={2}>
          <Flex direction="column" gap={1} align="flex-start">
            <Text fontWeight="semibold" fontSize="xs" whiteSpace="normal" wordBreak="break-word">
              {tc.title}
            </Text>
            {(tc.is_draft || tc.is_closed) && (
              <Flex gap={1}>
                {tc.is_draft && (
                  <Badge colorPalette="warning" variant="subtle" size="xs">
                    {t("test_cases.sheet_view.draft", "Draft")}
                  </Badge>
                )}
                {tc.is_closed && (
                  <Badge colorPalette="gray" variant="subtle" size="xs">
                    {t("test_cases.sheet_view.closed", "Closed")}
                  </Badge>
                )}
              </Flex>
            )}
            <Button
              size="2xs"
              variant="ghost"
              colorPalette="blue"
              h="18px"
              px={1}
              onClick={onViewDetails}
            >
              {t("test_cases.sheet_view.view_steps", "View Details")}
            </Button>
          </Flex>
        </Table.Cell>

        {/* Preconditions Column: ticks are shared with the inbox test case view */}
        <Table.Cell border="1px solid" borderColor="gray.200" py={1} px={2} verticalAlign="top">
          {tc.preconditions ? (
            <Box
              maxH="120px"
              overflowY="auto"
              fontSize="xs"
              css={{ "& .wmde-markdown": { fontSize: "12px" } }}
            >
              <SharedChecklist
                storageKey={preconditionsChecklistKey(userId, tc.id ?? "")}
                markdown={tc.preconditions}
                readOnly={locked}
                itemLabel="preconditions"
              />
            </Box>
          ) : (
            <Text fontSize="xs" color="gray.500">
              {t("test_cases.sheet_view.no_preconditions", "None")}
            </Text>
          )}
        </Table.Cell>

        <Table.Cell border="1px solid" borderColor="gray.200" fontSize="xs" py={1} px={2}>
          {projectMap[tc.project_id ?? -1] ?? t("common.unknown", "Unknown")}
        </Table.Cell>

        <Table.Cell border="1px solid" borderColor="gray.200" py={1} px={2}>
          <Badge variant="subtle" colorPalette="info" size="xs">
            {tc.environment_id && environmentMap[tc.environment_id]
              ? environmentMap[tc.environment_id]
              : t("test_cases.sheet_view.not_specified", "Not specified")}
          </Badge>
        </Table.Cell>

        <Table.Cell border="1px solid" borderColor="gray.200" py={1} px={2}>
          <PriorityBadge value={tc.priority} />
        </Table.Cell>

        <Table.Cell border="1px solid" borderColor="gray.200" py={1} px={2}>
          <PriorityBadge value={tc.urgency} />
        </Table.Cell>

        {/* Last Result Column */}
        <Table.Cell border="1px solid" borderColor="gray.200" py={1} px={2}>
          <Badge
            variant="solid"
            size="xs"
            colorPalette={
              lastResultState?.toLowerCase().includes("pass")
                ? "green"
                : lastResultState?.toLowerCase().includes("fail")
                ? "red"
                : "gray"
            }
          >
            {lastResultState ? lastResultState.toUpperCase() : t("test_cases.sheet_view.no_run", "NO RUN")}
          </Badge>
        </Table.Cell>

        {/* Status Column */}
        <Table.Cell border="1px solid" borderColor="gray.200" py={1} px={2}>
          <select
            style={{
              width: "100%",
              padding: "4px",
              borderRadius: "2px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              fontSize: "12px",
            }}
            value={sheetStatuses[tc.id!] || ""}
            disabled={locked}
            title={locked ? lockedReason : undefined}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setSheetStatuses({
                ...sheetStatuses,
                [tc.id!]: e.target.value as "passed" | "failed",
              })
            }
          >
            <option value="">{t("test_cases.sheet_view.status_placeholder", "Status...")}</option>
            <option value="passed">{t("test_plans.filter.passed", "Passed")}</option>
            <option value="failed">{t("test_plans.filter.failed", "Failed")}</option>
          </select>
        </Table.Cell>

        {/* Comments Column */}
        <Table.Cell border="1px solid" borderColor="gray.200" p={1}>
          <Textarea
            size="xs"
            placeholder={t("test_cases.sheet_view.comments_placeholder", "Comments...")}
            value={sheetNotes[tc.id!] || ""}
            disabled={locked}
            borderRadius="2px"
            borderColor="gray.300"
            bg="white"
            rows={2}
            minH="42px"
            p={1.5}
            fontSize="12px"
            lineHeight="short"
            resize="none"
            w="100%"
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setSheetNotes({
                ...sheetNotes,
                [tc.id!]: e.target.value,
              })
            }
          />
          <Flex align="center" gap={1} mt={1} wrap="wrap">
            <input
              ref={attachmentInputRef}
              type="file"
              multiple
              accept={ATTACHMENT_ACCEPT}
              hidden
              onChange={(e) => {
                const picked = Array.from(e.currentTarget.files ?? []);
                // Add to the files already chosen, skipping the same file picked twice
                const merged = [...attachments];
                for (const file of picked) {
                  if (!merged.some((f) => f.name === file.name && f.size === file.size)) {
                    merged.push(file);
                  }
                }
                onAttachmentsChange(merged);
                // Allow picking the same file again after clearing
                e.currentTarget.value = "";
              }}
            />
            <Button
              size="2xs"
              variant="ghost"
              colorPalette="blue"
              h="18px"
              px={1}
              disabled={locked}
              onClick={() => attachmentInputRef.current?.click()}
            >
              <IconPaperclip size={12} />
              {t("test_cases.sheet_view.attach", "Attach")}
            </Button>
            {attachments.length > 0 && (
              <>
                <Text
                  fontSize="2xs"
                  color="fg.muted"
                  truncate
                  maxW="140px"
                  title={attachments.map((f) => f.name).join(", ")}
                >
                  {attachments.length === 1
                    ? attachments[0].name
                    : t("test_cases.sheet_view.files_selected", "{{count}} files", {
                        count: attachments.length,
                      })}
                </Text>
                <Button
                  size="2xs"
                  variant="ghost"
                  h="18px"
                  minW="18px"
                  px={0}
                  aria-label={t("test_cases.sheet_view.clear_attachments", "Remove attachments")}
                  title={t("test_cases.sheet_view.clear_attachments", "Remove attachments")}
                  onClick={() => onAttachmentsChange([])}
                >
                  <IconX size={12} />
                </Button>
              </>
            )}
          </Flex>
        </Table.Cell>

        {/* Action Column */}
        <Table.Cell border="1px solid" borderColor="gray.200" textAlign="center" py={1} px={1}>
          <Button
            size="2xs"
            colorPalette="brand"
            disabled={locked || !sheetStatuses[tc.id!]}
            title={locked ? lockedReason : undefined}
            loading={executeMutation.isPending}
            onClick={() => {
              const chosenStatus = sheetStatuses[tc.id!];
              if (chosenStatus) {
                executeMutation.mutate({ tc, status: chosenStatus });
              }
            }}
          >
            {t("test_cases.sheet_view.record", "Record")}
          </Button>
        </Table.Cell>
      </Table.Row>
    );
  }
);