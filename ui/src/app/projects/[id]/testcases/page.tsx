"use client";
import {
  Avatar,
  AvatarGroup,
  Button,
  ButtonGroup,
  Flex,
  Heading,
  IconButton,
  Input,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Tab,
  Table,
  TableCaption,
  TableContainer,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tbody,
  Td,
  Tfoot,
  Th,
  Thead,
  Tr
} from '@chakra-ui/react';
import { IconAlertTriangle, IconChevronDown, IconClock, IconList, IconListCheck, IconListDetails, IconRefreshDot, IconTable } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import TestCaseService from '../../../../services/TestCaseService';

interface TestCase {
  code: string;
  description: string;
  usage_count: number;
}


export default function TestCase() {
  const testCaseService = new TestCaseService(import.meta.env.API_ENDPOINT)
  const [testCases, setTestCases] = useState<TestCase[]>([])

  const fetchTestCases = async () => {
    const testCaseData = await testCaseService.findAll();
    setTestCases(testCaseData);
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
      <Heading>PROJECT XYZ</Heading>
      <Heading as='h2' size='1xl'>Test Cases</Heading>

      <Flex bgColor={'gray.100'} py={'4'} px={'4'} align={'right'} mb={2} gap={3} alignItems={'flex-end'} className="actions">
        <Link href="/testcase/new">
          <Button bg="black" color="white">Add Test Case</Button>
        </Link>
        <Button bg="black" color="white"><IconRefreshDot color='red' />&nbsp;Start a Test Session</Button>
        <Button bg="green" color="white">Import from Excel</Button>
        <Button bg="green" color="white">Import from Google Sheets</Button>

        <ButtonGroup isAttached>
          <IconButton aria-label='Add to friends' bgColor={'grey'} color={'white'} icon={<IconListDetails />} />
          <IconButton aria-label='Add to friends' bgColor={'gray.300'} color={'black'} icon={<IconTable />} />
        </ButtonGroup>
      </Flex>

      <div className="search">
        <Input placeholder="Search for Test Cases " />
      </div>

      <Tabs>
        <TabList>
          <Tab><IconList />&nbsp; All Test Cases</Tab>
          <Tab color={'green'}><IconListCheck />&nbsp;Completed / Closed</Tab>
          <Tab color={'red'}><IconAlertTriangle />&nbsp;Failing</Tab>
          <Tab color={'orange'}><IconClock />&nbsp;Scheduled</Tab>
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
            Completed and Closed Test Cases
          </TabPanel>
          <TabPanel>
            Failing Cases
          </TabPanel>
          <TabPanel>
            Scheduled Cases
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  )
}