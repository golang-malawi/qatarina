import { useState } from "react";
import {
  Box,
  Button,
  Badge,
  Container,
  Heading,
  Menu,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { IconChevronDown } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";
import { findTestCaseInboxByIdQueryOptions, findTestCaseInboxQueryOptions, findTestCaseSummaryQueryOptions } from "@/data/queries/test-cases";
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

export const Route = createFileRoute("/workspace/test-cases/inbox/$testCaseId/")({
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
      queryClient.invalidateQueries({
        queryKey: findTestCaseInboxQueryOptions.queryKey,
      });

      queryClient.invalidateQueries({
        queryKey: findTestCaseSummaryQueryOptions.queryKey,
      })
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
      <Heading size="lg" color="fg.heading">
        {tc.description}
      </Heading>
      <Menu.Root>
        <Menu.Trigger asChild>
          <Button size="sm" variant="outline" colorPalette="brand">
            <IconChevronDown />
            Actions
          </Button>
        </Menu.Trigger>
        <Menu.Content bg="bg.surface" border="sm" borderColor="border.subtle">
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
          <Menu.Item value="" color="fg.error">
            Delete
          </Menu.Item>
        </Menu.Content>
      </Menu.Root>

      <Container my="4">
        <Heading size="lg" color="fg.heading">
          {tc.title}
        </Heading>
        <Text color="fg.muted">
          <strong>Code:</strong> {tc.code}
        </Text>
        <Text color="fg.muted">
          <strong>Description:</strong> {tc.description}
        </Text>
        <Text color="fg.muted">
          <strong>Kind:</strong> {tc.kind}
        </Text>
        {isDraft && (
          <Badge colorPalette="warning" variant="subtle">
            Draft
          </Badge>
        )}
      </Container>

      <Container p="4" border="sm" borderColor="border.subtle" bg="bg.surface">
        <Heading size="lg" color="fg.heading">
          Record a Test Result on this test case
        </Heading>
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
          colorPalette="success"
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
          colorPalette="danger"
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
