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
import { apiClient } from "@/lib/api/query";
import type { components } from "@/lib/api/v1";
import { markTestCaseAsDraft } from "@/services/TestCaseService";
import {toaster} from "@/components/ui/toaster";

type CommitTestRunResult = components["schemas"]["schema.CommitTestRunResult"];

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
    mutationFn: async () => await markTestCaseAsDraft(testCaseId),
    onSuccess: () => {
      toaster.create({title: "Success", description: "Marked as draft", type: "success"});
      queryClient.invalidateQueries({ queryKey: findTestCaseByIdQueryOptions(testCaseId).queryKey});
    },
    onError: () => {
      toaster.create({ title: "Error", description: "Failed to mark as draft", type: "error"});
    },
  });

  const runId = testCase?.testRunID

  const recordTestRun = useMutation({
    mutationFn: async ({state}: {state: "success" | "failure"}) => {
      if (!runId) throw new Error("No test run ID available")

     const commitPayload: CommitTestRunResult = {
      test_run_id: runId,
      notes: state === "success" ? "Test passed" : "Test failed",
      is_closed: true,
      tested_on: new Date().toISOString(),
       actual_result:
        state === "success"
          ? "Behavior matched expectation"
          : "Behaviour did not match expectation",
      expected_result: testCase.description ?? "",
      result_state: state === "success" ? "passed" : "failed",
    };  
     
      return apiClient.POST("/v1/test-runs/{testRunID}/commit", {
        params: {path: { testRunID: runId}},
        body: commitPayload,
      });
    },
    onSuccess: () => {
      console.log("Test result recorded successfully");
    },
    onError: (err) => {
      console.error("Failed to record test result", err);
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
          <Menu.Item value="mark-draft" onClick={() => markDraftMutation.mutate(tc.id)}>
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
        <Button type="button"
         variant="outline" 
         colorScheme="blue"
         onClick={() => recordTestRun.mutate({state: "success"})}
         loading={recordTestRun.isPending}
         >
          Record Successful Test
        </Button>
        &nbsp;
        <Button type="button"
         variant="outline" 
         colorScheme="red"
         onClick={() => recordTestRun.mutate({state: "failure"})}
         loading={recordTestRun.isPending}
         >
          Record Failed Test
        </Button>
      </Container>
    </Box>
  );
}

