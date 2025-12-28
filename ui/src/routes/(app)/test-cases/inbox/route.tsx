import { findTestCaseInboxQueryOptions } from "@/data/queries/test-cases";
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

export const Route = createFileRoute("/(app)/test-cases/inbox")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(findTestCaseInboxQueryOptions),
  component: TestCasePageInbox,
});

function TestCasePageInbox() {
  const {
    data: testCases,
    isPending,
    error,
  } = useSuspenseQuery(findTestCaseInboxQueryOptions);

  if (isPending) {
    return (
      <Flex justify="center" align="center" minH="80vh">
        <Spinner size="xl" color="teal.500" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Box p={6} textAlign="center" color="red.500">
        Error fetching test cases.
      </Box>
    );
  }

  const testCaseRows = (testCases?.test_cases ?? []).map(
    (tc: components["schemas"]["schema.AssignedTestCase"], idx: number) => (
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
          params={{ testCaseId: tc.id }}
          title={tc.description}
        >
          <Text fontWeight="semibold" mb={1}>
            {tc.code}
          </Text>
          <Text fontSize="sm" color="gray.600" maxLines={1}>
            {tc.description}
          </Text>
          <Stack direction="row" mt={2} gap={2}>
            <Badge color="blue.700">
              {/*tc.usageCount*/ 0} tests performed
            </Badge>
            <Badge color="green">Success: 0</Badge>
            <Badge color="red">Failed: 0</Badge>
          </Stack>
        </Link>
      </Box>
    )
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
