import { findTestCaseAllQueryOptions } from "@/data/queries/test-cases";
import {
  Box,
  Flex,
  Input,
  Container,
  Heading,
  Stack,
  Badge,
} from "@chakra-ui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/test-cases/inbox")({
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

  const testCaseRows = (testCases?.data?.test_cases ?? []).map(
    (tc: any, idx: number) => (
      <Box padding={"6px"} borderBottom={"1px solid #efefef"} key={idx}>
        <Link
          to={`/test-cases/inbox/$testCaseId`}
          params={{
            testCaseId: tc.id,
          }}
          title={tc.description}
        >
          <strong>{tc.code}</strong> -{" "}
          {tc.description?.substring(0, 40) + "..."}
        </Link>
        <Stack direction="row">
          <Badge color="blue.700">{tc.usage_count ?? 0} tests performed</Badge>
          <Badge color="green">Success: 0</Badge>
          <Badge color="red.700">Failed: 0</Badge>
        </Stack>
      </Box>
    ),
  );

  return (
    <div>
      <Heading size={"3xl"}>Test Case Inbox</Heading>
      <Flex
        align={"right"}
        mb="0"
        gap={3}
        p="4"
        alignItems={"flex-end"}
        borderBottom={"1px solid #efefef"}
        className="actions"
      >
        <Input placeholder="Search for Test Cases " w="100%" />
      </Flex>
      <Flex direction={"row"} gap="0">
        <Container height={"100vh"} p="0">
          <Flex direction="column">{testCaseRows}</Flex>
        </Container>
        <Container p="2" borderLeft={"1px solid #efefef"}>
          <Outlet />
        </Container>
      </Flex>
    </div>
  );
}
