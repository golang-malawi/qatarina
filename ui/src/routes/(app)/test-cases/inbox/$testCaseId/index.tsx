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
import { findTestCaseInboxByIdQueryOptions } from "@/data/queries/test-cases";
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  markTestCaseAsDraft,
  unmarkTestCaseAsDraft,
} from "@/services/TestCaseService";
import { executeTestRun } from "@/services/TestRunService";

import { toaster } from "@/components/ui/toaster";

export const Route = createFileRoute("/(app)/test-cases/inbox/$testCaseId/")({
  loader: ({ context: { queryClient }, params: { testCaseId } }) =>
    queryClient.ensureQueryData(findTestCaseInboxByIdQueryOptions(testCaseId)),
  component: TestCaseInboxItem,
});

function TestCaseInboxItem() {
  const { testCaseId } = Route.useParams();
  const queryClient = useQueryClient();

  const { data: testCase } = useSuspenseQuery(
    findTestCaseInboxByIdQueryOptions(testCaseId)
  );

  const tc = testCase;
  const isDraft = tc.is_draft;
  const testRunId = tc.test_run_id;
  const expectedResult = tc.expected_result ?? tc.description;

  const [resultText, setResultText] = useState("");
  const [notesText, setNotesText] = useState("");

  const executeMutation = useMutation({
    mutationFn: async ({ status }: { status: "passed" | "failed" }) => {
     
      if (!testRunId || !expectedResult || !resultText) {
        throw new Error("Missing required test case data.");
      }

      return executeTestRun(testRunId, {
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
        queryKey: findTestCaseInboxByIdQueryOptions(testCaseId).queryKey,
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
        queryKey: findTestCaseInboxByIdQueryOptions(testCaseId).queryKey,
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
      <Heading size="lg">{tc.description}</Heading>
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
          disabled={isDraft || !testRunId}
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
          disabled={isDraft || !testRunId}
        >
          Record Failed Test
        </Button>
      </Container>
    </Box>
  );
}
