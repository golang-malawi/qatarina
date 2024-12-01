import {
  Button,
  Flex,
  Input,
  Table,
  TableCaption,
  Tabs,
} from "@chakra-ui/react";
import TestCaseService from "@/services/TestCaseService";
import { createFileRoute } from "@tanstack/react-router";
import {
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuTrigger,
} from "@/components/ui/menu";
import { Avatar, AvatarGroup } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/(app)/_layout/test-cases/")({
  component: TestCasePage,
});

interface TestCase {
  code: unknown;
  description: unknown;
  usage_count: number;
}

function TestCasePage() {
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
    <Table.Row key={idx}>
      <Table.Cell>{tc.code?.toString()}</Table.Cell>
      <Table.Cell>{tc.description?.toString()}</Table.Cell>
      <Table.Cell textAlign="end">{tc.usage_count}</Table.Cell>
      <Table.Cell>
        <AvatarGroup size="md">
          <Avatar name="Ryan Florence" src="https://bit.ly/ryan-florence" />
          <Avatar name="Segun Adebayo" src="https://bit.ly/sage-adebayo" />
          <Avatar name="Kent Dodds" src="https://bit.ly/kent-c-dodds" />
          <Avatar name="Prosper Otemuyiwa" src="https://bit.ly/prosper-baba" />
          <Avatar name="Christian Nwamba" src="https://bit.ly/code-beast" />
        </AvatarGroup>
      </Table.Cell>
      <Table.Cell>
        <MenuRoot>
          <MenuTrigger as={Button}>Actions</MenuTrigger>
          <MenuContent>
            <MenuItem value="view">View</MenuItem>
            <MenuItem value="copy">Create a Copy</MenuItem>
            <MenuItem value="draft">Mark as Draft</MenuItem>
            <MenuItem value="plan">Use in Test Plan</MenuItem>
            <MenuItem color="red" value="">
              Delete
            </MenuItem>
          </MenuContent>
        </MenuRoot>
      </Table.Cell>
    </Table.Row>
  ));
  return (
    <div>
      <h1>Test Cases</h1>

      <Flex
        align={"right"}
        mb={2}
        gap={3}
        alignItems={"flex-end"}
        className="actions"
      >
        {/* <Link to="/test-cases/new">
          <Button bg="black" color="white">
            Create New
          </Button>
        </Link> */}
        <Button bg="green" color="white">
          Import from Excel
        </Button>
        <Button bg="green" color="white">
          Import from Google Sheets
        </Button>
      </Flex>

      <div className="search">
        <Input placeholder="Search for Test Cases " />
      </div>

      <Tabs.Root>
        <Tabs.List>
          <Tabs.Trigger value="all">All Test Cases</Tabs.Trigger>
          <Tabs.Trigger value="failing">Failing</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="all">
          <Table.Root variant="line">
            <TableCaption>
              Imperial to meTable.Rowic conversion factors
            </TableCaption>
            <Table.Header>
              <Table.Row>
                <Table.Cell>Code</Table.Cell>
                <Table.Cell>Test Case</Table.Cell>
                <Table.Cell textAlign="end">Times Used/Referenced</Table.Cell>
                <Table.Cell>Tested By</Table.Cell>
                <Table.Cell>Actions</Table.Cell>
              </Table.Row>
            </Table.Header>
            <Table.Body>{testCaseRows}</Table.Body>
            <Table.Footer>
              <Table.Row>
                <Table.Cell>Code</Table.Cell>
                <Table.Cell>Test Case</Table.Cell>
                <Table.Cell textAlign="end">Times Used/Referenced</Table.Cell>
                <Table.Cell>Tested By</Table.Cell>
                <Table.Cell>Actions</Table.Cell>
              </Table.Row>
            </Table.Footer>
          </Table.Root>
        </Tabs.Content>
        <Tabs.Content value="failing">Failing Cases</Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
