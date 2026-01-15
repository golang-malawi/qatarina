import { useState } from "react";
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
import { findTestRunsByProjectQueryOptions } from "@/data/queries/test-runs";

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

  const tc = testCase;
  const isDraft = tc.is_draft;

  const {data: testRuns = []} = useSuspenseQuery(
    tc.project_id
    ? findTestRunsByProjectQueryOptions(tc.project_id)
    : {queryKey: ["test-runs", "none"], queryFn: async () => []}
  );
  
  const testRun = testRuns?.find(
    (run) =>
      run.test_case_id === tc.id &&
      run.result_state == "pending"
  );

  const [resultText, setResultText] = useState("");
  const [notesText, setNotesText] = useState("");

  const executeMutation = useMutation({
    mutationFn: async ({ status }: { status: "passed" | "failed" }) => {
      const testRunId = testRun?.id;
      const expectedResult = tc.description;

      if (!testRunId || !expectedResult || !resultText) {
        throw new Error("Missing required test case data.");
      }

      return executeTestCase(testRunId, {
        id: testRunId,
        status,
        result: resultText,
        notes: notesText,
        expected_result: expectedResult,
      });
    },
    onSuccess: () => {
      toaster.create({
        title: "Success",
        description: "Test result recorded",
        type: "success",
      });
      setResultText("")
      setNotesText("");

      queryClient.invalidateQueries({
        queryKey: findTestCaseByIdQueryOptions(testCaseId).queryKey,
      });
    },
    onError: () => {
      toaster.create({
        title: "Error",
        description: "Failed to record test result",
        type: "error",
      });
    },
  });

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
        <Textarea
          placeholder="Observed behaviour (result)"
          value={resultText}
          onChange={(e) => setResultText(e.target.value)}
          mb="2" 
        />
        <Textarea placeholder="Notes about the testing process"
        value={notesText}
        onChange={(e) => setNotesText(e.target.value)} mb="4"/>
        <Button
          type="button"
          variant="outline"
          colorScheme="blue"
          onClick={() => {
            executeMutation.mutate({ status: "passed" });
          }}
          disabled={tc.is_draft || !testRun}
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
          disabled={tc.is_draft || !testRun}
        >
          Record Failed Test
        </Button>
      </Container>
    </Box>
  );
}
async function executeTestCase(
  testRunId: string,
  {
    id,
    status,
    result,
    notes,
    expected_result,
  }: {
    id: string;
    status: "passed" | "failed";
    result: string;
    notes: string;
    expected_result: string;
  }
): Promise<void> {
  const response = await fetch(`/v1/test-runs/${testRunId}/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id,
      status,
      result,
      notes,
      expected_result,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to execute test case");
  }
}

