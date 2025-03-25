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
import { useQuery } from "@tanstack/react-query";
import { Link, Outlet } from "react-router-dom";
import TestCaseService from "@/services/TestCaseService";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/test-cases/inbox/")({
  component: TestCasePageInbox,
});

interface TestCase {
  id: string;
  code: string;
  description: string;
  usage_count: number;
}

function TestCasePageInbox() {
  const testCaseService = new TestCaseService();

  const {
    data: testCases,
    isPending,
    error,
  } = useQuery<TestCase[]>({
    queryFn: () => testCaseService.findAll(),
    queryKey: ["testCases"],
  });

  if (isPending) {
    return "Loading Projects...";
  }

  if (error) {
    return <div className="error">Error: error fetching</div>;
  }

  const testCaseRows = testCases.map((tc, idx) => (
    <Box padding={"6px"} borderBottom={"1px solid #efefef"} key={idx}>
      <Link to={`/test-cases/inbox/view/${tc.id}`} title={tc.description}>
        {tc.code} - {tc.description.substring(0, 40) + "..."}
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
      <Heading size={"3"}>Test Case Inbox</Heading>
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
