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
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { markTestCaseAsDraft } from "@/services/TestCaseService";
import {toaster} from "@/components/ui/toaster";

// type CommitTestRunResult = components["schemas"]["schema.CommitTestRunResult"];

export const Route = createFileRoute("/(app)/test-cases/inbox/$testCaseId/")({
  loader: ({ context: { queryClient }, params: { testCaseId } }) =>
    queryClient.ensureQueryData(findTestCaseByIdQueryOptions(testCaseId)),
  component: TestCaseInboxItem,
});

function TestCaseInboxItem() {
  const { testCaseId } = Route.useParams();
  const queryClient = useQueryClient();

  const { data: testCase } = useSuspenseQuery(
    findTestCaseByIdQueryOptions(testCaseId)
  );

  const markDraftMutation = useMutation({
    mutationFn: async (id: string) => await markTestCaseAsDraft(id),
    onSuccess: () => {
      toaster.create({title: "Success", description: "Marked as draft", type: "success"});
      queryClient.invalidateQueries({ queryKey: findTestCaseByIdQueryOptions(testCaseId).queryKey});
    },
    onError: () => {
      toaster.create({ title: "Error", description: "Failed to mark as draft", type: "error"});
    },
  });

  //const runId = testCase?.testRunID

  const executeMutation = useMutation({
    mutationFn: async ({ status }: { status: "passed" | "failed" }) => {
      const userId = testCase?.assigned_to_id;

      if (!userId) {
        throw new Error("No user ID found to attribute this execution to.");
      }

      return executeTestCase(testCaseId, {
        status,
        result:
          status === "passed"
            ? "Behavior matched expectation"
            : "Behaviour did not match expectation",
            // TODO
        executed_by: userId, 
        notes:
          status === "passed"
            ? "Test passed successfully"
            : "Test failed during execution",
      });
    },
  });

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
          <Menu.Item value="mark-draft" onClick={() => markDraftMutation.mutate(testCaseId)}>
            Mark as Draft
            </Menu.Item>
          <Menu.Item value="">Use in Test Plan</Menu.Item>
          <Menu.Item value="" color="red">
            Delete
          </Menu.Item>
        </Menu.Content>
      </Menu.Root>

      <Container p="4" border="1px solid #f3f3f3">
        <Heading size="lg">Record a Test Result on this test case</Heading>
        <Textarea placeholder="Record a Test Result on this test case" />
        <Button
          type="button"
          variant="outline"
          colorScheme="blue"
          onClick={() => executeMutation.mutate({ status: "passed" })}
          loading={executeMutation.isPending}
        >
          Record Successful Test
        </Button>
        &nbsp;
        <Button
          type="button"
          variant="outline"
          colorScheme="red"
          onClick={() => executeMutation.mutate({ status: "failed" })}
          loading={executeMutation.isPending}
        >
          Record Failed Test
        </Button>
      </Container>
    </Box>
  );
}
