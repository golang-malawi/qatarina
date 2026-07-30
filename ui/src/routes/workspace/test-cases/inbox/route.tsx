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
  const [moduleFilter, setModuleFilter] = React.useState<string>("");
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(10);
  const [isSheetView, setIsSheetView] = useState(false);

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

  const moduleOptions = Array.from(
    new Set(testCases.map((tc) => tc?.feature_or_module).filter(Boolean))
  ).map((v) => ({ label: v, value: v }));

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

  const filteredTestCases = testCases.filter(
    (tc) => !moduleFilter || tc?.feature_or_module === moduleFilter
  );

  const totalPages = Math.ceil((pagination?.total ?? 0) / pageSize) || 1;

  return (
    <Flex h="100vh" direction={{ base: "column", md: "row" }}>
      {/* Left Pane - Test Case List / Navigation */}
      {!isSheetView && (
        <Box
          w={{ base: "full", md: "sm" }}
          borderRight="sm"
          borderColor="border.subtle"
          bg="bg.surface"
          overflowY="auto"
          display="flex"
          flexDirection="column"
        >
          <Box p={6} borderBottom="sm" borderColor="border.subtle">
            <Heading size="lg" color="fg.heading">
              Test Case Inbox
            </Heading>

            <Flex mt={4} gap={2}>
              <Button
                colorPalette="brand"
                variant="outline"
                onClick={() => setIsSheetView(true)}
              >
                Sheet View
              </Button>
              <Link to="/workspace/test-cases/inbox/suggest">
                <Button colorPalette="brand">Suggest Test Case</Button>
              </Link>
            </Flex>

            <Input
              placeholder="Search for Test Cases..."
              mt={4}
              variant="outline"
              focusRingColor="brand.focusRing"
              flex="1"
            />
            <Checkbox
              mt={4}
              checked={includeClosed}
              onCheckedChange={(e) => {
                setIncludeClosed(e.checked as boolean);
                setPage(1);
              }}
            >
              Show closed test cases
            </Checkbox>
            <Box mt={2}>
              <select
                value={moduleFilter}
                onChange={(e) => {
                  setModuleFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All</option>
                {moduleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Box>
          </Box>

          <Box flex="1" overflowY="auto">
            {filteredTestCases.length > 0 ? (
              filteredTestCases.map((tc, idx) => {
                const counts = summaryMap.get(tc.id ?? "") ?? {
                  usage_count: 0,
                  success_count: 0,
                  failure_count: 0,
                };
                return (
                  <Box
                    key={tc.id ?? idx}
                    p={4}
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
                        <Text fontWeight="semibold" fontSize="md">
                          {tc.title}
                        </Text>
                        <Text fontSize="sm" color="fg.subtle">
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
              <Box p={6} textAlign="center" color="fg.subtle">
                No test cases found.
              </Box>
            )}
          </Box>

          {/* Standard Pagination Controls */}
          <Box p={4} borderTop="sm" borderColor="border.subtle" bg="bg.surface">
            <Flex justify="space-between" align="center">
              <Button
                size="sm"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Text fontSize="sm">
                Page {page} of {totalPages}
              </Text>
              <Button
                size="sm"
                onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </Flex>
          </Box>
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