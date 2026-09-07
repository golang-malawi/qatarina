import {
  findTestCaseInboxQueryOptions,
  findTestCaseSummaryQueryOptions,
} from "@/data/queries/test-cases";
import {
  Box,
  Flex,
  Input,
  Stack,
  Badge,
  Text,
  Spinner,
  Heading,
  Button,
} from "@chakra-ui/react";
import { Checkbox } from "@/components/ui/checkbox";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { findProjectsQueryOptions } from "@/data/queries/projects";
import React, { useState } from "react";
import { SheetView } from "./sheetView";
import $api from "@/lib/api/query";

export const Route = createFileRoute("/workspace/test-cases/inbox")({
  loader: ({ context: { queryClient } }) => {
    queryClient.ensureQueryData(findTestCaseInboxQueryOptions(false, 1, 10));
    queryClient.ensureQueryData(findTestCaseSummaryQueryOptions);
  },
  component: TestCasePageInbox,
});

function TestCasePageInbox() {
  const [includeClosed, setIncludeClosed] = React.useState(false);
  const [filterType, setFilterType] = React.useState<string>("");
  const [filterValue, setFilterValue] = React.useState<string>("");
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(10);
  const [isSheetView, setIsSheetView] = useState(false);
  const [isGrouped, setIsGrouped] = useState(false);

  // Fetch inbox test cases with pagination parameters
  const {
    data: testCasesResponse,
    isPending: isPendingInbox,
    error: errorInbox,
  } = useSuspenseQuery(findTestCaseInboxQueryOptions(includeClosed, page, pageSize));

  const testCases = testCasesResponse?.test_cases ?? [];
  const pagination = (testCasesResponse as any)?.pagination;

  const { data: projects } = useSuspenseQuery(findProjectsQueryOptions);
  const projectMap: Record<number, string> = {};
  (projects?.projects ?? []).forEach((p: any) => {
    projectMap[p.id] = p.title;
  });

  // Extract unique project IDs to fetch environments for the current page
  const uniqueProjectIds = Array.from(
    new Set(testCases.map((tc) => tc.project_id).filter(Boolean))
  );

  const envQuery0 = $api.useQuery("get", "/v1/projects/{projectID}/environments", {
    params: { path: { projectID: (uniqueProjectIds[0] ?? "").toString() } },
    enabled: uniqueProjectIds.length > 0 && uniqueProjectIds[0] !== undefined,
  });
  const envQuery1 = $api.useQuery("get", "/v1/projects/{projectID}/environments", {
    params: { path: { projectID: (uniqueProjectIds[1] ?? "").toString() } },
    enabled: uniqueProjectIds.length > 1 && uniqueProjectIds[1] !== undefined,
  });
  const envQuery2 = $api.useQuery("get", "/v1/projects/{projectID}/environments", {
    params: { path: { projectID: (uniqueProjectIds[2] ?? "").toString() } },
    enabled: uniqueProjectIds.length > 2 && uniqueProjectIds[2] !== undefined,
  });
  const envQuery3 = $api.useQuery("get", "/v1/projects/{projectID}/environments", {
    params: { path: { projectID: (uniqueProjectIds[3] ?? "").toString() } },
    enabled: uniqueProjectIds.length > 3 && uniqueProjectIds[3] !== undefined,
  });
  const envQuery4 = $api.useQuery("get", "/v1/projects/{projectID}/environments", {
    params: { path: { projectID: (uniqueProjectIds[4] ?? "").toString() } },
    enabled: uniqueProjectIds.length > 4 && uniqueProjectIds[4] !== undefined,
  });

  const environmentQueries = [envQuery0, envQuery1, envQuery2, envQuery3, envQuery4];

  const environmentMap: Record<number, string> = {};
  environmentQueries.forEach((query) => {
    const envs = (query.data as any)?.environments ?? [];
    envs.forEach((e: any) => {
      environmentMap[e.id] = e.name;
    });
  });

  // Build secondary options strictly based on available test cases in the current inbox list
  const getSubOptions = () => {
    switch (filterType) {
      case "project": {
        const presentProjectIds = Array.from(
          new Set(testCases.map((tc) => tc.project_id).filter(Boolean))
        );
        return presentProjectIds.map((id) => ({
          label: projectMap[id as number] ?? `Project ${id}`,
          value: id!.toString(),
        }));
      }
      case "environment": {
        const presentEnvIds = Array.from(
          new Set(testCases.map((tc) => tc.environment_id).filter(Boolean))
        );
        return presentEnvIds.map((id) => ({
          label: environmentMap[id as number] ?? `Environment ${id}`,
          value: id!.toString(),
        }));
      }
      case "module":
        return Array.from(
          new Set(testCases.map((tc) => tc?.feature_or_module).filter(Boolean))
        ).map((v) => ({ label: v, value: v }));
      case "date": {
        const dateStrs = Array.from(
          new Set(
            testCases
              .map((tc) => (tc?.created_at ? tc.created_at.substring(0, 7) : null))
              .filter(Boolean)
          )
        );
        return dateStrs.map((dateStr) => {
          const [year, month] = (dateStr as string).split("-");
          const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
          const shortMonthLabel = dateObj.toLocaleString("en", { month: "short", year: "numeric" });
          return { label: shortMonthLabel, value: dateStr as string };
        });
      }
      default:
        return [];
    }
  };

  const subOptions = getSubOptions();

  const {
    data: summary,
    isPending: isPendingSummary,
    error: errorSummary,
  } = useSuspenseQuery(findTestCaseSummaryQueryOptions);

  if (isPendingInbox || isPendingSummary) {
    return (
      <Flex justify="center" align="center" minH="80vh">
        <Spinner size="xl" color="brand.solid" />
      </Flex>
    );
  }

  if (errorInbox || errorSummary) {
    return (
      <Box p={6} textAlign="center" color="fg.error">
        Error fetching test cases.
      </Box>
    );
  }

  const summaryMap = new Map<
    string,
    { usage_count: number; success_count: number; failure_count: number }
  >();
  (summary ?? []).forEach((s) => {
    summaryMap.set(s.test_case_id ?? "", {
      usage_count: s.usage_count ?? 0,
      success_count: s.success_count ?? 0,
      failure_count: s.failure_count ?? 0,
    });
  });

  const filteredTestCases = testCases.filter((tc) => {
    if (!filterType || !filterValue) return true;

    if (filterType === "project") {
      return tc?.project_id?.toString() === filterValue;
    }
    if (filterType === "environment") {
      return tc?.environment_id?.toString() === filterValue;
    }
    if (filterType === "module") {
      return tc?.feature_or_module === filterValue;
    }
    if (filterType === "date") {
      return tc?.created_at && tc.created_at.startsWith(filterValue);
    }
    return true;
  });

  // Grouped structure for tree-like view when isGrouped is true
  const groupedByModule = filteredTestCases.reduce((acc, tc) => {
    const moduleName = tc.feature_or_module || "Unassigned Module";
    if (!acc[moduleName]) {
      acc[moduleName] = [];
    }
    acc[moduleName].push(tc);
    return acc;
  }, {} as Record<string, typeof filteredTestCases>);

  const totalPages = Math.ceil((pagination?.total ?? 0) / pageSize) || 1;
  const isFiltered = Boolean(filterType && filterValue);

  return (
    <Flex h="100vh" direction={{ base: "column", md: "row" }}>
      {/* Left Pane - Test Case List / Navigation with increased width */}
      {!isSheetView && (
        <Box
          w={{ base: "full", md: "lg" }}
          borderRight="sm"
          borderColor="border.subtle"
          bg="bg.surface"
          overflowY="auto"
          display="flex"
          flexDirection="column"
        >
          <Box p={4} borderBottom="sm" borderColor="border.subtle">
            <Heading size="md" color="fg.heading">
              Test Case Inbox
            </Heading>

            <Flex mt={3} gap={2}>
              <Button
                size="sm"
                colorPalette="brand"
                variant="outline"
                onClick={() => setIsSheetView(true)}
              >
                Sheet View
              </Button>
              <Link to="/workspace/test-cases/inbox/suggest">
                <Button size="sm" colorPalette="brand">Suggest Test Case</Button>
              </Link>
            </Flex>

            <Input
              placeholder="Search for Test Cases..."
              mt={3}
              size="sm"
              variant="outline"
              focusRingColor="brand.focusRing"
            />
            <Checkbox
              mt={3}
              checked={includeClosed}
              onCheckedChange={(e) => {
                setIncludeClosed(e.checked as boolean);
                setPage(1);
              }}
            >
              Show closed test cases
            </Checkbox>

            {/* Compact filters and group button on the same line with original font styling */}
            <Flex mt={3} gap={2} align="center">
              <Box flex="1">
                <select
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value);
                    setFilterValue("");
                    setPage(1);
                  }}
                  style={{ width: "100%", padding: "6px 8px", fontSize: "14px" }}
                >
                  <option value="">Filter Type...</option>
                  <option value="project">Project</option>
                  <option value="environment">Environment</option>
                  <option value="module">Module / Feature</option>
                  <option value="date">Date (Year-Month)</option>
                </select>
              </Box>

              <Box flex="1">
                <select
                  value={filterValue}
                  onChange={(e) => {
                    setFilterValue(e.target.value);
                    setPage(1);
                  }}
                  disabled={!filterType}
                  style={{ width: "100%", padding: "6px 8px", fontSize: "14px", opacity: filterType ? 1 : 0.6 }}
                >
                  <option value="">Filter Value...</option>
                  {subOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Box>

              <Box flex="none">
                <Button
                  size="sm"
                  variant={isGrouped ? "solid" : "outline"}
                  colorPalette="brand"
                  onClick={() => setIsGrouped(!isGrouped)}
                >
                  {isGrouped ? "Ungroup" : "Group by Module"}
                </Button>
              </Box>
            </Flex>
          </Box>

          <Box flex="1" overflowY="auto">
            {isGrouped ? (
              Object.keys(groupedByModule).length > 0 ? (
                Object.entries(groupedByModule).map(([moduleName, tcs]) => (
                  <Box key={moduleName} mb={2}>
                    <Box
                      px={4}
                      py={2}
                      bg="bg.subtle"
                      borderBottom="sm"
                      borderColor="border.subtle"
                    >
                      <Text fontWeight="bold" fontSize="xs" color="fg.muted" textTransform="uppercase">
                        📂 {moduleName} ({tcs.length})
                      </Text>
                    </Box>

                    {tcs.map((tc, idx) => {
                      const counts = summaryMap.get(tc.id ?? "") ?? {
                        usage_count: 0,
                        success_count: 0,
                        failure_count: 0,
                      };
                      return (
                        <Box
                          key={tc.id ?? idx}
                          p={3}
                          pl={5}
                          borderBottom="sm"
                          borderColor="border.subtle"
                          _hover={{ bg: "bg.subtle", cursor: "pointer" }}
                          opacity={tc.is_closed ? 0.5 : 1}
                        >
                          <Link
                            to="/workspace/test-cases/inbox/$testCaseId"
                            params={{ testCaseId: tc.id ?? "" }}
                            title={tc.description ?? ""}
                          >
                            <Flex direction="column">
                              <Text fontWeight="semibold" fontSize="sm">
                                {tc.title}
                              </Text>
                              <Text fontSize="xs" color="fg.subtle">
                                {projectMap[tc.project_id ?? -1] ?? "Unknown Project"}
                              </Text>
                            </Flex>
                            <Stack direction="row" mt={2} gap={2}>
                              <Badge colorPalette="info" variant="subtle">
                                {counts.usage_count} tests performed
                              </Badge>
                              <Badge colorPalette="success" variant="subtle">
                                Success: {counts.success_count}
                              </Badge>
                              <Badge colorPalette="danger" variant="subtle">
                                Failed: {counts.failure_count}
                              </Badge>
                            </Stack>
                          </Link>
                        </Box>
                      );
                    })}
                  </Box>
                ))
              ) : (
                <Box p={6} textAlign="center" color="fg.subtle" fontSize="sm">
                  No test cases found.
                </Box>
              )
            ) : (
              filteredTestCases.length > 0 ? (
                filteredTestCases.map((tc, idx) => {
                  const counts = summaryMap.get(tc.id ?? "") ?? {
                    usage_count: 0,
                    success_count: 0,
                    failure_count: 0,
                  };
                  return (
                    <Box
                      key={tc.id ?? idx}
                      p={3}
                      borderBottom="sm"
                      borderColor="border.subtle"
                      _hover={{ bg: "bg.subtle", cursor: "pointer" }}
                      opacity={tc.is_closed ? 0.5 : 1}
                    >
                      <Link
                        to="/workspace/test-cases/inbox/$testCaseId"
                        params={{ testCaseId: tc.id ?? "" }}
                        title={tc.description ?? ""}
                      >
                        <Flex direction="column">
                          <Text fontWeight="semibold" fontSize="sm">
                            {tc.title}
                          </Text>
                          <Text fontSize="xs" color="fg.subtle">
                            {projectMap[tc.project_id ?? -1] ?? "Unknown Project"}
                          </Text>
                        </Flex>
                        <Stack direction="row" mt={2} gap={2}>
                          <Badge colorPalette="info" variant="subtle">
                            {counts.usage_count} tests performed
                          </Badge>
                          <Badge colorPalette="success" variant="subtle">
                            Success: {counts.success_count}
                          </Badge>
                          <Badge colorPalette="danger" variant="subtle">
                            Failed: {counts.failure_count}
                          </Badge>
                        </Stack>
                      </Link>
                    </Box>
                  );
                })
              ) : (
                <Box p={6} textAlign="center" color="fg.subtle" fontSize="sm">
                  No test cases found.
                </Box>
              )
            )}
          </Box>

          {/* Standard Pagination Controls (Hidden when a client-side filter is active) */}
          {!isFiltered && (
            <Box p={3} borderTop="sm" borderColor="border.subtle" bg="bg.surface">
              <Flex justify="space-between" align="center">
                <Button
                  size="xs"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Text fontSize="xs">
                  Page {page} of {totalPages}
                </Text>
                <Button
                  size="xs"
                  onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </Flex>
            </Box>
          )}
        </Box>
      )}

      {/* Right Pane / Content Area */}
      <Box flex="1" p={isSheetView ? 0 : 6} bg="bg.canvas" overflowY="auto">
        {isSheetView ? (
          <SheetView
            includeClosed={includeClosed}
            projectMap={projectMap}
            environmentMap={environmentMap}
            onBackToStandard={() => setIsSheetView(false)}
          />
        ) : (
          <Outlet />
        )}
      </Box>
    </Flex>
  );
}