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
import { Toaster, toaster } from "@/components/ui/toaster"
import {
  IconAlertTriangle,
  IconChevronDown,
  IconClock,
  IconList,
  IconListCheck,
  IconListDetails,
  IconTable,
} from "@tabler/icons-react";
import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { testCasesByProjectIdQueryOptions } from "@/data/queries/test-cases";
import { useSuspenseQuery } from "@tanstack/react-query";
import TestersAvatarGroup from "@/components/TestersAvatarGroup";
import { importTestCasesFromFile } from "@/services/TestCaseService";
import { markTestCaseAsDraft, useClosedTestCasesQuery, useFailingTestCasesQuery, useScheduledTestCasesQuery } from "@/services/TestCaseService";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-cases/"
)({
  loader: ({ context: { queryClient }, params: { projectId } }) =>
    queryClient.ensureQueryData(testCasesByProjectIdQueryOptions(projectId)),
  component: ListProjectTestCases,
});

export default function ListProjectTestCases() {
  const { projectId } = Route.useParams();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();
  const markDraftMutation = useMutation({
    mutationFn: async (id: string) => await markTestCaseAsDraft(id),
    onSuccess: () => {
      toaster.create({title: "Success", description: "Marked as draft", type: "success"});
      queryClient.invalidateQueries({queryKey: testCasesByProjectIdQueryOptions(projectId)}.queryKey);
    },
    onError: () => {
      toaster.create({title: "Error", description: "Failed to mark as draft", type: "error"});
    },
  });
  const { data: testCases } = useSuspenseQuery(
    testCasesByProjectIdQueryOptions(projectId)
  );
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await importTestCasesFromFile(projectId, file);

      toaster.create({
        title: "Import successful",
        description: "Test cases imported successfully",
        type: "success",
      });

      // Refresh test cases list
      await queryClient.invalidateQueries({
        queryKey: testCasesByProjectIdQueryOptions(projectId).queryKey,
      });

      // reset input so same file can be re-uploaded
      e.target.value = "";
    } catch (err: any) {
      toaster.create({
        title: "Import failed",
        description: err?.message || "Failed to import test cases",
        type: "error",
      });
    }
  };

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
              <Menu.Item value="view">
                <Link
                  to={"/projects/$projectId/test-cases/$testCaseId"}
                  params={{ projectId: projectId, testCaseId: tc.id }}
                >
                  View
                </Link>
              </Menu.Item>
              <Menu.Item value="create-copy">Create a Copy</Menu.Item>
              <Menu.Item value="mark-draft" onClick={() => markDraftMutation.mutate}>
                Mark as Draft
                </Menu.Item>
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
      <Toaster />
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
        <Button colorScheme="green" size="sm" onClick={handleImportClick}>
          Import from Excel
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

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
          <ClosedTestCasesTab projectID={projectId} />
        </Tabs.Content>
        <Tabs.Content value="failing">
          <FailingTestCasesTab projectID={projectId} />
          </Tabs.Content>
        <Tabs.Content value="scheduled">
          <ScheduledTestCasesTab projectID={projectId} />
          </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}

function ClosedTestCasesTab({projectID}: {projectID: string}){
  const {data, isLoading, error} = useClosedTestCasesQuery(projectID);

  if (isLoading) return <p>Loading closed cases...</p>;
  if (error) return <p>Failed to load test cases</p>;

  const testCases = data?.test_cases ?? [];

  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>Code</Table.ColumnHeader>
          <Table.ColumnHeader>Title</Table.ColumnHeader>
          <Table.ColumnHeader>Status</Table.ColumnHeader>
          <Table.ColumnHeader>Result</Table.ColumnHeader>
          <Table.ColumnHeader>Executed By</Table.ColumnHeader>
          <Table.ColumnHeader>Notes</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {testCases.map((tc: any) => (
          <Table.Row key={tc.id}>
            <Table.Cell>{tc.code}</Table.Cell>
            <Table.Cell>{tc.title}</Table.Cell>
            <Table.Cell>{tc.status}</Table.Cell>
            <Table.Cell>{tc.result}</Table.Cell>
            <Table.Cell>{tc.executed_by}</Table.Cell>
            <Table.Cell>{tc.notes}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}

function FailingTestCasesTab({ projectID }: { projectID: string }) {
  const { data, isLoading, error } = useFailingTestCasesQuery(projectID);

  if (isLoading) return <p>Loading failing cases...</p>;
  if (error) return <p>Failed to load failing test cases</p>;

  const testCases = data?.test_cases ?? [];

  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>Code</Table.ColumnHeader>
          <Table.ColumnHeader>Title</Table.ColumnHeader>
          <Table.ColumnHeader>Status</Table.ColumnHeader>
          <Table.ColumnHeader>Result</Table.ColumnHeader>
          <Table.ColumnHeader>Executed By</Table.ColumnHeader>
          <Table.ColumnHeader>Notes</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {testCases.map((tc: any) => (
          <Table.Row key={tc.id}>
            <Table.Cell>{tc.code}</Table.Cell>
            <Table.Cell>{tc.title}</Table.Cell>
            <Table.Cell>{tc.status}</Table.Cell>
            <Table.Cell>{tc.result}</Table.Cell>
            <Table.Cell>{tc.executed_by}</Table.Cell>
            <Table.Cell>{tc.notes}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}

function ScheduledTestCasesTab({ projectID }: { projectID: string }) {
  const { data, isLoading, error } = useScheduledTestCasesQuery(projectID);

  if (isLoading) return <p>Loading scheduled cases...</p>;
  if (error) return <p>Failed to load scheduled test cases</p>;

  const testCases = data?.test_cases ?? [];

  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>Code</Table.ColumnHeader>
          <Table.ColumnHeader>Title</Table.ColumnHeader>
          <Table.ColumnHeader>Status</Table.ColumnHeader>
          <Table.ColumnHeader>Result</Table.ColumnHeader>
          <Table.ColumnHeader>Executed By</Table.ColumnHeader>
          <Table.ColumnHeader>Notes</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {testCases.map((tc: any) => (
          <Table.Row key={tc.id}>
            <Table.Cell>{tc.code}</Table.Cell>
            <Table.Cell>{tc.title}</Table.Cell>
            <Table.Cell>{tc.status}</Table.Cell>
            <Table.Cell>{tc.result}</Table.Cell>
            <Table.Cell>{tc.executed_by}</Table.Cell>
            <Table.Cell>{tc.notes}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}