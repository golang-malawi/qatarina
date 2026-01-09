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
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  markTestCaseAsDraft,
  unmarkTestCaseAsDraft,
} from "@/services/TestCaseService";

import { toaster } from "@/components/ui/toaster";

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
        executed_by: String(userId),
        notes:
          status === "passed"
            ? "Test passed successfully"
            : "Test failed during execution",
      });
    },
  });

  const tc = testCase;
  const isDraft = tc.is_draft;

  const toggleDraftMutation = useMutation({
    mutationFn: async () => {
      if (isDraft) {
        return unmarkTestCaseAsDraft(testCaseId);
      }
      return markTestCaseAsDraft(testCaseId);
    },
    onSuccess: () => {
      toaster.create({
        title: "Success",
        description: isDraft
          ? "Test case unmarked as draft"
          : "Test case marked as draft",
        type: "success",
      });

      queryClient.invalidateQueries({
        queryKey: findTestCaseByIdQueryOptions(testCaseId).queryKey,
      });
    },
    onError: () => {
      toaster.create({
        title: "Error",
        description: "Failed to update draft status",
        type: "error",
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
          <Menu.Item
            value="toggle-draft"
            disabled={toggleDraftMutation.isPending}
            onClick={() => toggleDraftMutation.mutate()}
          >
            {isDraft ? "Unmark as Draft" : "Mark as Draft"}
          </Menu.Item>

          <Menu.Item value="">Use in Test Plan</Menu.Item>
          <Menu.Item value="" color="red">
            Delete
          </Menu.Item>
        </Menu.Content>
      </Menu.Root>

      <Container my="4">
        <Heading size="lg">{tc.title}</Heading>
        <p>
          <strong>Code:</strong> {tc.code}
        </p>
        <p>
          <strong>Description:</strong> {tc.description}
        </p>
        <p>
          <strong>Kind:</strong> {tc.kind}
        </p>
        {isDraft && (
          <Box
            as="span"
            fontSize="sm"
            bg="orange.100"
            color="orange.700"
            borderRadius="md"
          >
            Draft
          </Box>
        )}
      </Container>

      <Container p="4" border="1px solid #f3f3f3">
        <Heading size="lg">Record a Test Result on this test case</Heading>
        <Textarea placeholder="Record a Test Result on this test case" />
        <Button
          type="button"
          variant="outline"
          colorScheme="blue"
          onClick={() => executeMutation.mutate({ status: "passed" })}
          disabled={tc.is_draft}
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
          disabled={tc.is_draft}
        >
          Record Failed Test
        </Button>
      </Container>
    </Box>
  );
}
async function executeTestCase(
  testCaseId: string,
  {
    status,
    result,
    executed_by,
    notes,
  }: {
    status: "passed" | "failed";
    result: string;
    executed_by: string;
    notes: string;
  }
): Promise<void> {
  const response = await fetch(`/api/test-cases/${testCaseId}/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      status,
      result,
      executed_by,
      notes,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to execute test case");
  }
}

