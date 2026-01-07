import { Avatar } from "@/components/ui/avatar";
import { findTestCaseAllQueryOptions } from "@/data/queries/test-cases";
import {
  AvatarGroup,
  Button,
  Flex,
  Input,
  Menu,
  Table,
  TableCaption,
  Tabs,
} from "@chakra-ui/react";
import { IconChevronDown } from "@tabler/icons-react";
import { useSuspenseQuery, useQueryClient, useMutation} from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { markTestCaseAsDraft } from "@/services/TestCaseService";
import {toaster} from "@/components/ui/toaster";

export const Route = createFileRoute("/(app)/test-cases/")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(findTestCaseAllQueryOptions),
  component: TestCasePage,
});

function TestCasePage() {
  const {
    data: testCases,
    isPending,
    error,
  } = useSuspenseQuery(findTestCaseAllQueryOptions);

  const queryClient = useQueryClient();

  const markDraftMutation = useMutation({
    mutationFn: async (id: string) => await markTestCaseAsDraft(id),
    onSuccess: () => {
      toaster.create({title: "Success", description: "Marked as draft", type: "success"});
      queryClient.invalidateQueries({queryKey: findTestCaseAllQueryOptions.queryKey});
    },
    onError: () => {
      toaster.create({title: "Error", description: "Failed to mark as draft", type: "error"});
    }
  });

  if (isPending) {
    return "Loading Projects...";
  }

  if (error) {
    return <div className="error">Error: error fetching</div>;
  }

  const testCaseRows = (testCases?.data?.test_cases ?? []).map((tc: any, idx: number) => (
    <Table.Row key={idx}>
      <Table.Cell>{tc.code}</Table.Cell>
      <Table.Cell>{tc.description}</Table.Cell>
      <Table.Cell>{tc.usage_count}</Table.Cell>
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
        <Menu.Root>
          <Menu.Trigger asChild>
            <Button>
              <IconChevronDown /> Actions
            </Button>
          </Menu.Trigger>
          <Menu.Content>
            <Menu.Item value="">View</Menu.Item>
            <Menu.Item value="">Create a Copy</Menu.Item>
            <Menu.Item value="mark-draft" onClick={() => markDraftMutation.mutate(tc.id)}>
              Mark as Draft
              </Menu.Item>
            <Menu.Item value="">Use in Test Plan</Menu.Item>
            <Menu.Item value="" color="red">
              Delete
            </Menu.Item>
          </Menu.Content>
        </Menu.Root>
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
        <Link to="/test-cases/new">
          <Button bg="black" color="white">
            Create New
          </Button>
        </Link>
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

      <Tabs.Root defaultValue="all">
        <Tabs.List>
          <Tabs.Trigger value="all">All Test Cases</Tabs.Trigger>
          <Tabs.Trigger value="failing">Failing</Tabs.Trigger>
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
                    <Table.ColumnHeader>Times Used/Referenced</Table.ColumnHeader>
                    <Table.ColumnHeader>Tested By</Table.ColumnHeader>
                    <Table.ColumnHeader>Actions</Table.ColumnHeader>
                   </Table.Row>
                </Tfoot> */}
          </Table.Root>
        </Tabs.Content>
        <Tabs.Content value="failing">Failing Cases</Tabs.Content>
      </Tabs.Root>
    </div>
  );
}


