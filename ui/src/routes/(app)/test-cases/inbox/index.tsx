import { findTestCaseAllQueryOptions } from "@/data/queries/test-cases";
import {
  Box,
  Button,
  Flex,
  Input,
  Container,
  Heading,
  Stack,
  Badge,
} from "@chakra-ui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/test-cases/inbox/")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(findTestCaseAllQueryOptions),
  component: TestCasePageInbox,
});

function TestCasePageInbox() {
  const {
    data: testCases,
    isPending,
    error,
  } = useSuspenseQuery(findTestCaseAllQueryOptions);

  if (isPending) {
    return "Loading Projects...";
  }

  if (error) {
    return <div className="error">Error: error fetching</div>;
  }

  const testCaseRows = testCases.map((tc, idx) => (
    <Box padding={"6px"} borderBottom={"1px solid #efefef"} key={idx}>
      <Link
        to={`/test-cases/inbox/$testCaseId`}
        params={{
          testCaseId: tc.id,
        }}
        title={tc.description}
      >
        {tc.code} - {tc.description?.substring(0, 40) + "..."}
      </Link>
      <Stack direction="row">
        <Badge>Usage: {tc.usage_count ?? 0}</Badge>
        {/* <Badge colorScheme="green">Success</Badge>
        <Badge colorScheme="red">Removed</Badge>
        <Badge colorScheme="purple">New</Badge> */}
      </Stack>
    </Box>
  ));

  return (
    <div>
      <Heading size={"3xl"}>Test Case Inbox</Heading>
      <Flex
        align={"right"}
        mb={2}
        gap={3}
        alignItems={"flex-end"}
        className="actions"
      >
        <Link to="/test-cases/new">
          <Button bg="black" color="white">
            Create New
          </Button>
        </Link>
      </Flex>
      <div className="search">
        <Input placeholder="Search for Test Cases " />
      </div>

      <Flex direction={"row"}>
        <Container height={"100%"}>
          <Flex direction="column" borderRight={"1px solid #efefef"}>
            {testCaseRows}
          </Flex>
        </Container>
        <Container>
          <Outlet />
        </Container>
      </Flex>
    </div>
  );
}
