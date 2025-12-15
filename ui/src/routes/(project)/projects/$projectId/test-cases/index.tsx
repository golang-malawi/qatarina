import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AvatarGroup,
  Button,
  ButtonGroup,
  Flex,
  Heading,
  IconButton,
  Input,
  TableCaption,
  Tabs,
  Table,
  Menu,
  
} from "@chakra-ui/react";
import {
  IconAlertTriangle,
  IconChevronDown,
  IconClock,
  IconList,
  IconListCheck,
  IconListDetails,
  IconTable,
} from "@tabler/icons-react";
import { testCasesByProjectIdQueryOptions } from "@/data/queries/test-cases";
import { useSuspenseQuery } from "@tanstack/react-query";
import TestersAvatarGroup from "@/components/TestersAvatarGroup";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-cases/"
)({
  loader: ({ context: { queryClient }, params: { projectId } }) =>
    queryClient.ensureQueryData(testCasesByProjectIdQueryOptions(projectId)),
  component: ListProjectTestCases,
});

export default function ListProjectTestCases() {
  const { projectId } = Route.useParams();
  const { data: testCases } = useSuspenseQuery(
    testCasesByProjectIdQueryOptions(projectId)
  );

  const testCaseRows = (testCases?.test_cases ?? []).map(
    (tc: any, idx: number) => (
      <Table.Row key={idx}>
        <Table.Cell>{tc.code}</Table.Cell>
        <Table.Cell>{tc.description}</Table.Cell>
        <Table.Cell>{tc.usage_count}</Table.Cell>
        <Table.Cell>
          <AvatarGroup size="md">
            <TestersAvatarGroup testers={[]} />
          </AvatarGroup>
        </Table.Cell>
        <Table.Cell>
          <Menu.Root>
            <Menu.Trigger asChild>
              <Button>
                <IconChevronDown /> Actions
              </Button>
            </Menu.Trigger>
            <Menu.Content zIndex={100} position="absolute">
              <Menu.Item value="view"><Link to={`/projects/${projectId}/test-cases/${tc.id}`}>View</Link></Menu.Item>
              <Menu.Item value="create-copy">Create a Copy</Menu.Item>
              <Menu.Item value="mark-draft">Mark as Draft</Menu.Item>
              <Menu.Item value="use">Use in Test Session</Menu.Item>
              <Menu.Item color="red" value="delete">
                Delete
              </Menu.Item>
            </Menu.Content>
          </Menu.Root>
        </Table.Cell>
      </Table.Row>
    )
  );

  return (
    <div>
      <Heading as="h6" size="xl">
        Test Cases
      </Heading>

      <Flex
        py={"4"}
        px={"4"}
        align={"right"}
        mb={2}
        gap={3}
        alignItems={"flex-end"}
        className="actions"
      >
        <Link
          to={"/projects/$projectId/test-cases/new"}
          params={{ projectId: projectId }}
        >
          <Button variant={"outline"} colorScheme="blue" size={"sm"}>
            Add Test Cases
          </Button>
        </Link>
        <Button colorScheme="green" size={"sm"}>
          Import from Excel
        </Button>
        <Button bg="green" color="white" size={"sm"}>
          Import from Google Sheets
        </Button>

        <ButtonGroup>
          <IconButton
            aria-label="Add to friends"
            bgColor={"grey"}
            color={"white"}
            size={"sm"}
          >
            <IconListDetails />
          </IconButton>
          <IconButton
            aria-label="Add to friends"
            bgColor={"gray.300"}
            color={"black"}
            size={"sm"}
          >
            <IconTable />
          </IconButton>
        </ButtonGroup>
      </Flex>

      <div className="search">
        <Input placeholder="Search for Test Cases " />
      </div>

      <Tabs.Root defaultValue="all">
        <Tabs.List>
          <Tabs.Trigger value="all">
            <IconList />
            &nbsp; All Test Cases
          </Tabs.Trigger>
          <Tabs.Trigger color={"green"} value="completed">
            <IconListCheck />
            &nbsp;Completed / Closed
          </Tabs.Trigger>
          <Tabs.Trigger color={"red"} value="failing">
            <IconAlertTriangle />
            &nbsp;Failing
          </Tabs.Trigger>
          <Tabs.Trigger color={"orange"} value="scheduled">
            <IconClock />
            &nbsp;Scheduled
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="all">
          <Table.Root>
            <TableCaption>Imperial to metric conversion factors</TableCaption>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Code</Table.ColumnHeader>
                <Table.ColumnHeader>Test Case</Table.ColumnHeader>
                <Table.ColumnHeader>Times Used/Referenced</Table.ColumnHeader>
                <Table.ColumnHeader>Tested By</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>{testCaseRows}</Table.Body>
            {/* <Tfoot>
              <Table.Row>
                <Table.ColumnHeader>Code</Table.ColumnHeader>
                <Table.ColumnHeader>Test Case</Table.ColumnHeader>
                <Th isNumeric>Times Used/Referenced</Table.ColumnHeader>
                <Table.ColumnHeader>Tested By</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
               </Table.Row>
            </Tfoot> */}
          </Table.Root>
        </Tabs.Content>
        <Tabs.Content value="completed">
          Completed and Closed Test Cases
        </Tabs.Content>
        <Tabs.Content value="failing">Failing Cases</Tabs.Content>
        <Tabs.Content value="scheduled">Scheduled Cases</Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

