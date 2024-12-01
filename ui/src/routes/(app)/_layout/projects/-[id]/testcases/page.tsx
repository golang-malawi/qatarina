"use client";
import {
  Button,
  Flex,
  Group,
  Heading,
  IconButton,
  Input,
  Link,
  Table,
  TableCaption,
  Tabs,
} from "@chakra-ui/react";
import {
  IconAlertTriangle,
  IconClock,
  IconList,
  IconListCheck,
  IconListDetails,
  IconRefreshDot,
  IconTable,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import TestCaseService from "@/services/TestCaseService";
import { Avatar, AvatarGroup } from "@/components/ui/avatar";
import {
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuTrigger,
} from "@/components/ui/menu";

interface TestCase {
  code: string;
  description: string;
  usage_count: number;
}

export default function TestCase() {
  const testCaseService = new TestCaseService();
  const [testCases, setTestCases] = useState<TestCase[]>([]);

  const fetchTestCases = async () => {
    const testCaseData = await testCaseService.findAll();
    setTestCases(testCaseData);
  };

  useEffect(() => {
    fetchTestCases();
  }, []);

  const testCaseRows = testCases.map((tc, idx) => (
    <Table.Row key={idx}>
      <Table.Header>{tc.code}</Table.Header>
      <Table.Header>{tc.description}</Table.Header>
      <Table.Header textAlign="end">{tc.usage_count}</Table.Header>
      <Table.Header>
        <AvatarGroup size="md">
          <Avatar name="Ryan Florence" src="https://bit.ly/ryan-florence" />
          <Avatar name="Segun Adebayo" src="https://bit.ly/sage-adebayo" />
          <Avatar name="Kent Dodds" src="https://bit.ly/kent-c-dodds" />
          <Avatar name="Prosper Otemuyiwa" src="https://bit.ly/prosper-baba" />
          <Avatar name="Christian Nwamba" src="https://bit.ly/code-beast" />
        </AvatarGroup>
      </Table.Header>
      <Table.Header>
        <MenuRoot>
          <MenuTrigger asChild>
            <Button variant="outline" size="sm">
              Actions
            </Button>
          </MenuTrigger>
          <MenuContent>
            <MenuItem value="">View</MenuItem>
            <MenuItem value="">Create a Copy</MenuItem>
            <MenuItem value="">Mark as Draft</MenuItem>
            <MenuItem value="">Use in Test Session</MenuItem>
            <MenuItem color="red" value="">
              Delete
            </MenuItem>
          </MenuContent>
        </MenuRoot>
      </Table.Header>
    </Table.Row>
  ));

  return (
    <div>
      <Heading>PROJECT XYZ</Heading>
      <Heading as="h2" size="xl">
        Test Cases
      </Heading>

      <Flex
        bgColor={"gray.100"}
        py={"4"}
        px={"4"}
        align={"right"}
        mb={2}
        gap={3}
        alignItems={"flex-end"}
        className="actions"
      >
        <Link href="/testcase/new">
          <Button bg="black" color="white">
            Add Test Case
          </Button>
        </Link>
        <Button bg="black" color="white">
          <IconRefreshDot color="red" />
          &nbsp;Start a Test Session
        </Button>
        <Button bg="green" color="white">
          Import from Excel
        </Button>
        <Button bg="green" color="white">
          Import from Google Sheets
        </Button>

        <Group attached>
          <IconButton
            aria-label="Add to friends"
            bgColor={"grey"}
            color={"white"}
          >
            <IconListDetails />
          </IconButton>
          <IconButton
            aria-label="Add to friends"
            bgColor={"gray.300"}
            color={"black"}
          >
            <IconTable />
          </IconButton>
        </Group>
      </Flex>

      <div className="search">
        <Input placeholder="Search for Test Cases " />
      </div>

      <Tabs.Root>
        <Tabs.List>
          <Tabs.Trigger value="all">
            <IconList />
            &nbsp; All Test Cases
          </Tabs.Trigger>
          <Tabs.Trigger value="completed" color={"green"}>
            <IconListCheck />
            &nbsp;Completed / Closed
          </Tabs.Trigger>
          <Tabs.Trigger value="failing" color={"red"}>
            <IconAlertTriangle />
            &nbsp;Failing
          </Tabs.Trigger>
          <Tabs.Trigger value="scheduled" color={"orange"}>
            <IconClock />
            &nbsp;Scheduled
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="all">
          <Table.Root variant="line">
            <TableCaption>Imperial to metric conversion factors</TableCaption>
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
        <Tabs.Content value="completed">
          Completed and Closed Test Cases
        </Tabs.Content>
        <Tabs.Content value="failing">Failing Cases</Tabs.Content>
        <Tabs.Content value="scheduled">Scheduled Cases</Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
