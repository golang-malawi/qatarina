"use client";
import Image from "next/image";
import PocketBase, { RecordModel } from "pocketbase";
import {
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer,
  Avatar,
  AvatarGroup,
  Button,
  Input,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  TabPanels,
  TabPanel,
  TabList,
  Tabs,
  Tab,
  Flex,
} from '@chakra-ui/react'
import { useEffect, useState } from "react";
import Link from "next/link";
import { IconChevronDown } from "@tabler/icons-react";

const testcases = [
  {
    title: 'Test Feature #1',
    createdAt: 'yesterday',
    author: '@zikani03'
  }
];

export default function TestCase() {
  const [testCases, setTestCases] = useState<RecordModel[]>([])

  const pb = new PocketBase('http://127.0.0.1:8090');

  const fetchTestCases = async () => {
    const records = await pb.collection('test_cases').getFullList({
      sort: '-created',
    });
    setTestCases(records);
  }

  useEffect(() => {
    fetchTestCases();
  }, [])


  const testCaseRows = testCases.map((tc, idx) =>
    <Tr key={idx}>
      <Td>{tc.code}</Td>
      <Td>{tc.description}</Td>
      <Td isNumeric>{tc.usage_count}</Td>
      <Td>
        <AvatarGroup size='md' max={2}>
          <Avatar name='Ryan Florence' src='https://bit.ly/ryan-florence' />
          <Avatar name='Segun Adebayo' src='https://bit.ly/sage-adebayo' />
          <Avatar name='Kent Dodds' src='https://bit.ly/kent-c-dodds' />
          <Avatar name='Prosper Otemuyiwa' src='https://bit.ly/prosper-baba' />
          <Avatar name='Christian Nwamba' src='https://bit.ly/code-beast' />
        </AvatarGroup>
      </Td>
      <Td>
      <Menu>
        <MenuButton as={Button} rightIcon={<IconChevronDown />}>
          Actions
        </MenuButton>
        <MenuList>
          <MenuItem>View</MenuItem>
          <MenuItem>Create a Copy</MenuItem>
          <MenuItem>Mark as Draft</MenuItem>
          <MenuItem>Use in Test Session</MenuItem>
          <MenuItem color="red">Delete</MenuItem>
        </MenuList>
      </Menu>
      </Td>
    </Tr>)
  return (
    <div>
      <h1>Test Cases</h1>

      <Flex align={'right'} mb={2} gap={3} alignItems={'flex-end'} className="actions">
        <Link href="/testcase/new">
          <Button bg="black" color="white">Create New</Button>
        </Link>
        <Button bg="green" color="white">Import from Excel</Button>
        <Button bg="green" color="white">Import from Google Sheets</Button>
      </Flex>

      <div className="search">
        <Input placeholder="Search for Test Cases " />
      </div>


    <Tabs>
      <TabList>
        <Tab>All Test Cases</Tab>
        <Tab>Failing</Tab>
      </TabList>

      <TabPanels>
        <TabPanel>
        <TableContainer>
        <Table variant='simple'>
          <TableCaption>Imperial to metric conversion factors</TableCaption>
          <Thead>
            <Tr>
              <Th>Code</Th>
              <Th>Test Case</Th>
              <Th isNumeric>Times Used/Referenced</Th>
              <Th>Tested By</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {testCaseRows}
          </Tbody>
          <Tfoot>
            <Tr>
              <Th>Code</Th>
              <Th>Test Case</Th>
              <Th isNumeric>Times Used/Referenced</Th>
              <Th>Tested By</Th>
              <Th>Actions</Th>
            </Tr>
          </Tfoot>
        </Table>
      </TableContainer>
        </TabPanel>
        <TabPanel>
            Failing Cases
        </TabPanel>
      </TabPanels>
   </Tabs>
    </div>
  )
}