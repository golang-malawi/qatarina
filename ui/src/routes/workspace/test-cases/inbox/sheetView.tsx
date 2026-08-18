import React, { useState, useRef, useCallback, useMemo } from "react";
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
} from "@chakra-ui/react";
import { Checkbox } from "@/components/ui/checkbox";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { components } from "@/lib/api/v1";
import { useMutation, useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  findTestCaseInboxQueryOptions,
  findTestCaseSummaryQueryOptions,
} from "@/data/queries/test-cases";
import { createTestRun, executeTestRun } from "@/services/TestRunService";
import { toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/isLoggedIn";
import { apiClient } from "@/lib/api/query";
import { getInboxTestCases } from "@/services/TestCaseService";
import { useTranslation } from "react-i18next";

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
  const [sheetStatuses, setSheetStatuses] = useState<Record<string, "passed" | "failed">>({});
  const [sheetNotes, setSheetNotes] = useState<Record<string, string>>({});
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

  // Derive module options from loaded test cases
  const moduleOptions = useMemo(() => {
    return Array.from(
      new Set(testCases.map((tc) => (tc as any)?.feature_or_module).filter(Boolean))
    ).map((v) => ({ label: v as string, value: v as string }));
  }, [testCases]);

  // Apply feature/module filter client-side
  const filteredTestCases = useMemo(() => {
    return testCases.filter(
      (tc) => !moduleFilter || (tc as any)?.feature_or_module === moduleFilter
    );
  }, [testCases, moduleFilter]);

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

      return executeTestRun(run.id, {
        test_run_id: run.id,
        result_state: status,
        actual_result: resText,
        notes: noteText,
        expected_result: tc.description,
        environment_id: tc.environment_id,
        tested_on: new Date().toISOString(),
        is_closed: false,
      });
    },
    onSuccess: (_, variables) => {
      toaster.create({
        title: t("test_cases.toast.success", "Success"),
        description: t("test_cases.sheet_view.toast.success_desc", "Test result recorded via Sheet View"),
        type: "success",
      });
      queryClient.invalidateQueries(findTestCaseInboxQueryOptions(false));
      queryClient.invalidateQueries(findTestCaseSummaryQueryOptions);
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
              <Table.ColumnHeader width="8%">{t("test_cases.column.code", "Code")}</Table.ColumnHeader>
              <Table.ColumnHeader width="15%">{t("test_cases.column.title", "Title")}</Table.ColumnHeader>
              <Table.ColumnHeader width="12%">{t("test_cases.column.project", "Project")}</Table.ColumnHeader>
              <Table.ColumnHeader width="12%">{t("test_cases.column.environment", "Environment")}</Table.ColumnHeader>
              <Table.ColumnHeader width="10%">{t("test_cases.column.last_result", "Last Result")}</Table.ColumnHeader>
              <Table.ColumnHeader width="12%">{t("test_cases.column.status", "Status")}</Table.ColumnHeader>
              <Table.ColumnHeader width="23%">{t("test_cases.column.comments", "Comments")}</Table.ColumnHeader>
              <Table.ColumnHeader width="8%" textAlign="center">{t("test_cases.column.actions", "Action")}</Table.ColumnHeader>
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
                    projectMap={projectMap}
                    environmentMap={environmentMap}
                    sheetStatuses={sheetStatuses}
                    setSheetStatuses={setSheetStatuses}
                    sheetNotes={sheetNotes}
                    setSheetNotes={setSheetNotes}
                    onViewDetails={() => setSelectedTestCaseForDetails(tc)}
                    executeMutation={executeSheetMutation}
                  />
                );
              })
            ) : (
              <Table.Row>
                <Table.Cell colSpan={8} textAlign="center" color="gray.500" py={6}>
                  {t("test_cases.sheet_view.empty", "No test cases found.")}
                </Table.Cell>
              </Table.Row>
            )}

            {isFetchingNextPage && (
              <Table.Row>
                <Table.Cell colSpan={8} textAlign="center" py={3} color="gray.500" fontSize="xs">
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
            {(selectedTestCaseForDetails as any).preconditions && (
              <Box>
                <Text fontWeight="bold" fontSize="xs" color="gray.500" mb={1}>
                  {t("test_cases.details.preconditions", "PRECONDITIONS")}
                </Text>
                <Box color="gray.700" fontSize="sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {(selectedTestCaseForDetails as any).preconditions}
                  </ReactMarkdown>
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
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selectedTestCaseForDetails.description}
                  </ReactMarkdown>
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
// Sub-component to isolate Last Result fetching
// ---------------------------------------------
interface TestCaseRowProps {
  tc: components["schemas"]["schema.AssignedTestCase"];
  rowBg: string;
  projectMap: Record<number, string>;
  environmentMap: Record<number, string>;
  sheetStatuses: Record<string, "passed" | "failed">;
  setSheetStatuses: React.Dispatch<React.SetStateAction<Record<string, "passed" | "failed">>>;
  sheetNotes: Record<string, string>;
  setSheetNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onViewDetails: () => void;
  executeMutation: any;
}

const TestCaseRow = React.forwardRef<HTMLTableRowElement, TestCaseRowProps>(
  function TestCaseRow(
    {
      tc,
      rowBg,
      projectMap,
      environmentMap,
      sheetStatuses,
      setSheetStatuses,
      sheetNotes,
      setSheetNotes,
      onViewDetails,
      executeMutation,
    },
    ref
  ) {
    const { t } = useTranslation();

    const { data: runsData } = useQuery({
      queryKey: ["testRuns", tc.test_plan_id],
      queryFn: async () => {
        if (!tc.test_plan_id) return null;
        const res = await (apiClient.GET as any)("/v1/test-plans/{testPlanID}/test-runs", {
          params: { path: { testPlanID: tc.test_plan_id.toString() } },
        });
        if (res.error) throw new Error("Failed to fetch test runs");
        return res.data;
      },
      enabled: !!tc.test_plan_id,
    });

    const runsList = (runsData as any)?.test_runs ?? [];
    const lastRun = runsList.find((r: any) => r.test_case_id === tc.id);

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

        {/* Last Result Column */}
        <Table.Cell border="1px solid" borderColor="gray.200" py={1} px={2}>
          <Badge
            variant="solid"
            size="xs"
            colorPalette={
              lastRun?.result_state?.toLowerCase().includes("pass")
                ? "green"
                : lastRun?.result_state?.toLowerCase().includes("fail")
                ? "red"
                : "gray"
            }
          >
            {lastRun?.result_state ? lastRun.result_state.toUpperCase() : t("test_cases.sheet_view.no_run", "NO RUN")}
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
        </Table.Cell>

        {/* Action Column */}
        <Table.Cell border="1px solid" borderColor="gray.200" textAlign="center" py={1} px={1}>
          <Button
            size="2xs"
            colorPalette="brand"
            disabled={!sheetStatuses[tc.id!]}
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