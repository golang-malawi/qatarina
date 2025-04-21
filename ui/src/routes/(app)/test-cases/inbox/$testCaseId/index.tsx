import {
  Box,
  Button,
  Container,
  Heading,
  Menu,
  Textarea,
} from "@chakra-ui/react";
import { IconChevronDown } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { findTestCaseByIdQueryOptions } from "@/data/queries/test-cases";
import { useSuspenseQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/(app)/test-cases/inbox/$testCaseId/")({
  loader: ({ context: { queryClient }, params: { testCaseId } }) =>
    queryClient.ensureQueryData(findTestCaseByIdQueryOptions(testCaseId)),
  component: TestCaseInboxItem,
});

function TestCaseInboxItem() {
  const { testCaseId } = Route.useParams();

  const { data: testCase } = useSuspenseQuery(
    findTestCaseByIdQueryOptions(testCaseId)
  );

  return (
    <Box>
      <Heading size="lg">{testCase?.description}</Heading>
      <Menu.Root>
        <Menu.Trigger asChild>
          <Button>
            <IconChevronDown />
            Actions
          </Button>
        </Menu.Trigger>
        <Menu.Content>
          <Menu.Item value="">View</Menu.Item>
          <Menu.Item value="">Create a Copy</Menu.Item>
          <Menu.Item value="">Mark as Draft</Menu.Item>
          <Menu.Item value="">Use in Test Plan</Menu.Item>
          <Menu.Item value="" color="red">
            Delete
          </Menu.Item>
        </Menu.Content>
      </Menu.Root>

      <Container p="4" border="1px solid #f3f3f3">
        <Heading size="lg">Record a Test Result on this test case</Heading>
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

