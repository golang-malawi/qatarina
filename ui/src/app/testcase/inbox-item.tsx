import {
  Box,
  Button,
  Container,
  Heading,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Textarea,
} from "@chakra-ui/react";
import { IconChevronDown } from "@tabler/icons-react";
import { useParams } from "react-router";
import TestCaseService from "../../services/TestCaseService";
import { useEffect, useState } from "react";

export default function TestCaseInboxItem() {
  const { testCaseId } = useParams();
  const [testCase, setTestCase] = useState(null);
  const testCaseService = new TestCaseService();
  useEffect(() => {
    testCaseService.findById(testCaseId!).then((data) => {
      setTestCase(data);
    });
  }, [testCaseId]);

  return (
    <Box>
      <Heading size="1">{testCase?.description}</Heading>
      <Menu>
        <MenuButton as={Button} rightIcon={<IconChevronDown />}>
          Actions
        </MenuButton>
        <MenuList>
          <MenuItem>View</MenuItem>
          <MenuItem>Create a Copy</MenuItem>
          <MenuItem>Mark as Draft</MenuItem>
          <MenuItem>Use in Test Plan</MenuItem>
          <MenuItem color="red">Delete</MenuItem>
        </MenuList>
      </Menu>

      <Container p="4" border="1px solid #f3f3f3">
        <Heading size="1">Record a Test Result on this test case</Heading>
        <Textarea placeholder="Record a Test Result on this test case" />
        <Button type="button" variant="outline" colorScheme="blue">
          Record Successful Test
        </Button>
        &nbsp;
        <Button type="button" variant="outline" colorScheme="red">
          Record Failed Test
        </Button>
      </Container>
    </Box>
  );
}
