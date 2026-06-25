import { useState } from "react";
import {
  Box,
  Button,
  Badge,
  Container,
  Heading,
  Menu,
  Flex,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { IconChevronDown } from "@tabler/icons-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  findTestCaseInboxByIdQueryOptions,
} from "@/data/queries/test-cases";
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  markTestCaseAsDraft,
  unmarkTestCaseAsDraft,  
} from "@/services/TestCaseService";
import { createTestRun, executeTestRun } from "@/services/TestRunService"; 
import { toaster } from "@/components/ui/toaster";
import $api from "@/lib/api/query";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/hooks/isLoggedIn";   

export const Route = createFileRoute(
  "/workspace/test-cases/inbox/$testCaseId/",
)({
  loader: ({ context: { queryClient }, params: { testCaseId } }) =>
    queryClient.ensureQueryData(findTestCaseInboxByIdQueryOptions(testCaseId)),
  component: TestCaseInboxItem,
});

function TestCaseInboxItem() {
  const { testCaseId } = Route.useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const auth = useAuth();               
  const currentUser = auth.user;        

  const { data: testCase } = useSuspenseQuery(
    findTestCaseInboxByIdQueryOptions(testCaseId),
  );

  const tc = testCase;
  const isDraft = tc.is_draft;

  const [resultText, setResultText] = useState("");
  const [notesText, setNotesText] = useState("");

  const { data: { environments = [] } = {} } = $api.useQuery(
    "get",
    "/v1/projects/{projectID}/environments",
    { params: { path: { projectID: tc.project_id!.toString() } } },
  );

  const env = environments.find((e: any) => e.id === tc.environment_id);

  const executeMutation = useMutation({
    mutationFn: async ({ status }: { status: "passed" | "failed" }) => {
      if (!resultText) throw new Error("Observed behaviour (result) is required.");
      if (!tc.id) throw new Error("Test case ID is missing.");
      if (!currentUser?.user_id) throw new Error("User ID is missing.");
      if (!tc.project_id || !tc.test_plan_id) {
        throw new Error("Project ID or Test Plan ID is missing.");
      }

      // Step 1: create a new manual run
      const run = await createTestRun({
        test_case_id: tc.id,
        test_plan_id: tc.test_plan_id,
        project_id: tc.project_id,
        owner_id: currentUser.user_id,
        tested_by_id: currentUser.user_id,
        assigned_to_id: currentUser.user_id,
      });

      if (!run?.id) throw new Error("Run ID is missing.");

      // Step 2: record the result immediately
      return executeTestRun(run.id, {
        test_run_id: run.id,
        result_state: status,
        actual_result: resultText,
        notes: notesText,
        expected_result: tc.description,
        environment_id: tc.environment_id,
        tested_on: new Date().toISOString(),
        is_closed: false,
      });
    },
    onSuccess: () => {
      toaster.create({
        title: "Success",
        description: "Test result recorded",
        type: "success",
      });
      setResultText("");
      setNotesText("");

      queryClient.invalidateQueries({ queryKey: ["testCases", "inbox"] });
      queryClient.invalidateQueries({ queryKey: ["testCases", "inbox", testCaseId] });
      queryClient.invalidateQueries({ queryKey: ["testCases", "summary"] });
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

  if (tc.is_closed) {
    return (
      <Box>
        <Heading size="lg" color="fg.heading">
          {tc.title}
        </Heading>
        <Badge colorScheme="gray" ml={2}>
          Closed
        </Badge>
        <Text mt={2}>{tc.description}</Text>
        <Text mt={4} color="fg.subtle">
          This test case is closed. Results can no longer be recorded.
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      <Flex alignItems="center" justifyContent="space-between">
        <Heading size="lg" color="fg.heading">
          {tc.title}
        </Heading>
        <Button size="sm" variant="solid" colorPalette="brand" onClick={() => navigate({ to: `/projects/${tc.project_id}/test-plans/${tc.test_plan_id}/` })}>Go to Test Plan</Button>
      </Flex>
      <Menu.Root>
        <Menu.Trigger asChild>
          <Button size="sm" variant="outline" colorPalette="brand">
            <IconChevronDown />
            Actions
          </Button>
        </Menu.Trigger>
        <Menu.Content bg="bg.surface" border="sm" borderColor="border.subtle">
          <Menu.Item value="" onClick={() => navigate({ to: `/projects/${tc.project_id}/test-cases/${testCaseId}/` })}>
            View
          </Menu.Item>
          <Menu.Item
            value="toggle-draft"
            disabled={toggleDraftMutation.isPending}
            onClick={() => toggleDraftMutation.mutate()}
          >
            {isDraft ? "Unmark as Draft" : "Mark as Draft"}
          </Menu.Item>
        </Menu.Content>
      </Menu.Root>

      <Container my="4">
        <Text color="fg.muted">
          <strong>Code:</strong> {tc.code}
        </Text>
        <Box mt={2}>
          <Heading size="sm" mb={2} color="fg.heading">
            Description
          </Heading>
          {tc.description ? (
            <ReactMarkdown>{tc.description}</ReactMarkdown>
          ) : (
            <Text color="fg.subtle">No description provided.</Text>
          )}
        </Box>
        <Text color="fg.muted">
          <strong>Kind:</strong> {tc.kind}
        </Text>
        <Text>
          <strong>Environment:</strong> {env ? env.name : "Not specified"}
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
        <Textarea
          placeholder="Notes about the testing process"
          value={notesText}
          onChange={(e) => setNotesText(e.target.value)}
          mb="4"
        />
        <Button
          type="button"
          variant="outline"
          colorPalette="success"
          onClick={() => executeMutation.mutate({ status: "passed" })}
          disabled={isDraft}
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
          disabled={isDraft}
        >
          Record Failed Test
        </Button>
      </Container>
    </Box>
  );
}
