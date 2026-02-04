import { 
  findTestCaseInboxQueryOptions,
  findTestCaseSummaryQueryOptions, 
} from "@/data/queries/test-cases";
import { components } from "@/lib/api/v1";
import {
  Box,
  Flex,
  Input,
  Stack,
  Badge,
  Text,
  Spinner,
  Heading,
} from "@chakra-ui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { findProjectsQueryOptions } from "@/data/queries/projects";

export const Route = createFileRoute("/(app)/test-cases/inbox")({
  loader: ({ context: { queryClient } }) =>{
    queryClient.ensureQueryData(findTestCaseInboxQueryOptions);
    queryClient.ensureQueryData(findTestCaseSummaryQueryOptions);
  },
  component: TestCasePageInbox,
});

function TestCasePageInbox() {
  const {
    data: testCases,
    isPending: isPendingInbox,
    error: errorInbox,
  } = useSuspenseQuery(findTestCaseInboxQueryOptions);

  const {data: projects} = useSuspenseQuery(findProjectsQueryOptions);
  const projectMap: Record<number, string> = {};
  (projects?.projects ?? []).forEach((p: any) => {
    projectMap[p.id] = p.title;
  });

  const {
    data: summary,
    isPending: isPendingSummary,
    error: errorSummary,
  } = useSuspenseQuery(findTestCaseSummaryQueryOptions);

  if (isPendingInbox || isPendingSummary) {
    return (
      <Flex justify="center" align="center" minH="80vh">
        <Spinner size="xl" color="teal.500" />
      </Flex>
    );
  }

  if (errorInbox || errorSummary) {
    return (
      <Box p={6} textAlign="center" color="red.500">
        Error fetching test cases.
      </Box>
    );
  }

  const summaryMap = new Map<
    string,
    {usage_count: number; success_count: number; failure_count: number}
  >();
  (summary ?? []).forEach((s) => {
    summaryMap.set(s.test_case_id ?? "", {
      usage_count: s.usage_count ?? 0,
      success_count: s.success_count ?? 0,
      failure_count: s.failure_count ?? 0,
    });
  });

  const testCaseRows = (testCases?.test_cases ?? []).map(
    (tc: components["schemas"]["schema.AssignedTestCase"], idx: number) => {
      const counts = 
      summaryMap.get(tc.id ?? "") ?? {
        usage_count: 0,
        success_count: 0,
        failure_count: 0,
      };

      return (
      <Box
        key={idx}
        p={4}
        borderBottom="1px solid"
        borderColor="gray.200"
        _hover={{
          bg: "gray.50",
          cursor: "pointer",
        }}
        transition="background 0.2s"
      >
        <Link
          to="/test-cases/inbox/$testCaseId"
          params={{ testCaseId: tc.id ?? "" }}
          title={tc.description}
        >
          <Flex direction="column">
            <Text fontWeight="semibold" fontSize="md">
              {tc.title}
            </Text>
            <Text fontSize="sm" color="gray.500">
              {projectMap[tc.project_id ?? -1] ?? "Unknown Project"}
            </Text>
          </Flex>
          <Stack direction="row" mt={2} gap={2}>
            <Badge color="blue.700">
              {counts.usage_count} tests performed
            </Badge>
            <Badge color="green">Success: {counts.success_count}</Badge>
            <Badge color="red">Failed: {counts.failure_count}</Badge>
          </Stack>
        </Link>
      </Box>
      );
    }
  );

  return (
    <Flex h="100vh">
      {/* Left Pane - Test Case List */}
      <Box
        w={{ base: "full", md: "400px" }}
        borderRight="1px solid"
        borderColor="gray.200"
        overflowY="auto"
      >
        <Box p={6} borderBottom="1px solid" borderColor="gray.200">
          <Heading size="lg" color="teal.600">
            Test Case Inbox
          </Heading>
          <Input
            placeholder="Search for Test Cases..."
            mt={4}
            variant="outline"
            focusRingColor="teal.400"
          />
        </Box>

        <Box>{testCaseRows}</Box>
      </Box>

      {/* Right Pane - Details */}
      <Box flex="1" p={6} bg="gray.50">
        <Outlet />
      </Box>
    </Flex>
  );
}
