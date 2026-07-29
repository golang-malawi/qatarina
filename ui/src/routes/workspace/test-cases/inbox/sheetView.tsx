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
} from "@chakra-ui/react";
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
  includeClosed,
}: SheetViewProps) {
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
      const resText = "Executed via Sheet View";
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
        title: "Success",
        description: "Test result recorded via Sheet View",
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
        title: "Error",
        description: "Failed to record test result",
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
        Error loading sheet view test cases.
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" h="full" w="full" p={0} m={0}>
      <Flex justify="space-between" align="center" mb={1} px={2} pt={1} flexShrink={0}>
        <Heading size="md" color="fg.heading">
          Test Case Sheet View 
        </Heading>
        <Button
          size="xs"
          variant="outline"
          colorPalette="brand"
          onClick={onBackToStandard}
        >
          Back to Standard View
        </Button>
      </Flex>

      <Box flex="1" overflowY="auto" borderTop="1px solid" borderBottom="1px solid" borderColor="gray.300" bg="white" w="full">
        <Table.Root size="sm" variant="outline" css={{ borderCollapse: "collapse", tableLayout: "fixed", width: "100%" }}>
          <Table.Header position="sticky" top={0} zIndex={1} bg="gray.100">
            <Table.Row>
              <Table.ColumnHeader width="8%">Code</Table.ColumnHeader>
              <Table.ColumnHeader width="15%">Title</Table.ColumnHeader>
              <Table.ColumnHeader width="12%">Project</Table.ColumnHeader>
              <Table.ColumnHeader width="12%">Environment</Table.ColumnHeader>
              <Table.ColumnHeader width="10%">Last Result</Table.ColumnHeader>
              <Table.ColumnHeader width="12%">Status</Table.ColumnHeader>
              <Table.ColumnHeader width="23%">Comments</Table.ColumnHeader>
              <Table.ColumnHeader width="8%" textAlign="center">Action</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {testCases.length > 0 ? (
              testCases.map((tc, index) => {
                const isLast = index === testCases.length - 1;
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
                  No test cases found.
                </Table.Cell>
              </Table.Row>
            )}

            {isFetchingNextPage && (
              <Table.Row>
                <Table.Cell colSpan={8} textAlign="center" py={3} color="gray.500" fontSize="xs">
                  Loading more test cases...
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
            w="400px"
            bg="white"
            h="full"
            p={6}
            boxShadow="xl"
            overflowY="auto"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            display="flex"
            flexDirection="column"
          >
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="sm">Test Case Steps</Heading>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => setSelectedTestCaseForDetails(null)}
              >
                ✕
              </Button>
            </Flex>

            <Box mb={4}>
              <Text fontWeight="bold" fontSize="xs" color="gray.500">
                TITLE
              </Text>
              <Text fontWeight="semibold" fontSize="md">
                {selectedTestCaseForDetails.title}
              </Text>
            </Box>

            <Box flex="1">
              <Text fontWeight="bold" fontSize="xs" color="gray.500" mb={2}>
                DESCRIPTION & STEPS
              </Text>
              <Text fontSize="sm" whiteSpace="pre-wrap" color="gray.700">
                {selectedTestCaseForDetails.description || "No detailed steps provided."}
              </Text>
            </Box>

            <Button
              size="sm"
              variant="outline"
              mt={4}
              onClick={() => setSelectedTestCaseForDetails(null)}
            >
              Close
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
      <Table.Row ref={ref} bg={rowBg} _hover={{ bg: "blue.50" }}>
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
              View Steps
            </Button>
          </Flex>
        </Table.Cell>

        <Table.Cell border="1px solid" borderColor="gray.200" fontSize="xs" py={1} px={2}>
          {projectMap[tc.project_id ?? -1] ?? "Unknown"}
        </Table.Cell>

        <Table.Cell border="1px solid" borderColor="gray.200" py={1} px={2}>
          <Badge variant="subtle" colorPalette="info" size="xs">
            {tc.environment_id && environmentMap[tc.environment_id]
              ? environmentMap[tc.environment_id]
              : "Not specified"}
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
            {lastRun?.result_state ? lastRun.result_state.toUpperCase() : "NO RUN"}
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
            <option value="">Status...</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
          </select>
        </Table.Cell>

        {/* Comments Column */}
        <Table.Cell border="1px solid" borderColor="gray.200" p={1}>
          <Textarea
            size="xs"
            placeholder="Comments..."
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
            Record
          </Button>
        </Table.Cell>
      </Table.Row>
    );
  }
);
