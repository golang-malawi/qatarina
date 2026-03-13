import { createFileRoute } from "@tanstack/react-router";
import {
  Tabs,
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Fieldset,
  Heading,
  Text,
  Flex,
  Alert,
  Stack,
  Spinner,
} from "@chakra-ui/react";
import { AppDialog } from "@/components/ui/app-dialog";

import { useTestCaseQuery } from "@/services/TestCaseService";
import { useProjectTestPlansQuery } from "@/services/TestPlanService";
import { assignTestersToTestPlan } from "@/services/TestPlanService";
import { useTestersQuery } from "@/services/TesterService";
import { useState } from "react";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-cases/$testCaseId/",
)({
  component: ViewTestCase,
});

function ViewTestCase() {
  const { projectId, testCaseId } = Route.useParams();

  const { data, isLoading, error } = useTestCaseQuery(testCaseId);
  const testPlansQuery = useProjectTestPlansQuery(projectId);
  const testersQuery = useTestersQuery();

  /** ---------- STATE ---------- */
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedTesters, setSelectedTesters] = useState<string[]>([]);

  /** Optimistic UI state */
  const [optimisticAssignment, setOptimisticAssignment] = useState<{
    test_plan_id: string | null;
    testers: string[];
  } | null>(null);

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="40">
        <Spinner size="xl" color="brand.solid" />
      </Flex>
    );
  }
  if (error) return <Text color="fg.error">Error loading test case</Text>;

  const testCase = data;
  if (!testCase) return <Text color="fg.muted">No data found</Text>;

  /** ---------- DERIVED ---------- */
  const effectivePlanId = optimisticAssignment?.test_plan_id ?? selectedPlanId;

  const isLockedToPlan = !!optimisticAssignment?.test_plan_id;

  return (
    <Box
      p={6}
      bg="bg.surface"
      border="sm"
      borderColor="border.subtle"
      borderRadius="xl"
      shadow="card"
      display="flex"
      flexDirection="column"
      gap={6}
    >
      {/* Header */}
      <Stack gap={1}>
        <Heading size="lg" color="fg.heading">
          {testCase.title}
        </Heading>
        <Text fontSize="sm" color="fg.subtle">
          Code: {testCase.code} • Feature: {testCase.feature_or_module}
        </Text>
        <Text fontSize="sm" color="fg.subtle">
          Project ID: {projectId}
        </Text>
      </Stack>

      <Tabs.Root defaultValue="description">
        <Tabs.List>
          <Tabs.Trigger value="description">Description</Tabs.Trigger>
          {/* <Tabs.Trigger value="metadata">Metadata</Tabs.Trigger>
          <Tabs.Trigger value="tags">Tags</Tabs.Trigger>
          <Tabs.Trigger value="documents">Documents</Tabs.Trigger> */}
          <Tabs.Trigger value="usage">Usage & Assignment</Tabs.Trigger>
        </Tabs.List>

        {/* DESCRIPTION */}
        <Tabs.Content value="description">
          <Box
            p={4}
            bg="bg.subtle"
            rounded="lg"
            border="sm"
            borderColor="border.subtle"
          >
            {/* Description */}
            <Text mb={3} color="fg.muted">
              {testCase.description || "No description provided."}
            </Text>

            {/* Tags */}
            <Box mb={3}>
              {testCase.tags?.length ? (
                <Flex gap={2} wrap="wrap">
                  {testCase.tags.map((tag: string) => (
                    <Box
                      key={tag}
                      px={3}
                      py={1}
                      bg="brand.subtle"
                      color="brand.fg"
                      fontSize="xs"
                      fontWeight="medium"
                      rounded="full"
                    >
                      {tag}
                    </Box>
                  ))}
                </Flex>
              ) : (
                <Text fontSize="sm" color="fg.subtle">
                  No tags
                </Text>
              )}
            </Box>

            {/* Metadata */}
            <Box
              p={3}
              bg="bg.surface"
              rounded="md"
              border="sm"
              borderColor="border.subtle"
              shadow="sm"
            >
              <Stack gap={2} fontSize="sm" color="fg.muted">
                <Flex justify="space-between">
                  <Text fontWeight="semibold">Type:</Text>
                  <Text>{testCase.kind}</Text>
                </Flex>

                <Flex justify="space-between">
                  <Text fontWeight="semibold">Created By:</Text>
                  <Text>User ID {testCase.created_by}</Text>
                </Flex>

                <Flex justify="space-between">
                  <Text fontWeight="semibold">Status:</Text>
                  <Text color={testCase.is_draft ? "fg.warning" : "fg.success"}>
                    {testCase.is_draft ? "Draft" : "Published"}
                  </Text>
                </Flex>

                <Flex justify="space-between">
                  <Text fontWeight="semibold">Created At:</Text>
                  <Text>
                    {testCase.created_at
                      ? new Date(testCase.created_at).toLocaleString()
                      : "N/A"}
                  </Text>
                </Flex>

                <Flex justify="space-between">
                  <Text fontWeight="semibold">Updated At:</Text>
                  <Text>
                    {testCase.updated_at
                      ? new Date(testCase.updated_at).toLocaleString()
                      : "N/A"}
                  </Text>
                </Flex>
              </Stack>
            </Box>
          </Box>
        </Tabs.Content>

        {/* DOCUMENTS */}
        <Tabs.Content value="documents">
          <Text color="fg.muted">No documents uploaded yet.</Text>
        </Tabs.Content>

        {/* ===================== USAGE & ASSIGNMENT ===================== */}
        <Tabs.Content value="usage">
          <Stack mt={4} gap={4}>
            <Heading size="sm" color="fg.heading">
              Assign to Test Plan
            </Heading>
            <Alert.Root status="info">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description>
                  A test case can belong to only one test plan.
                </Alert.Description>
              </Alert.Content>
            </Alert.Root>

            {/* TEST PLANS */}
            {testPlansQuery.data?.test_plans?.length ? (
              <CheckboxGroup
                value={effectivePlanId ? [effectivePlanId] : []}
                onValueChange={(value) => {
                  // 🚫 HARD VALIDATION — only one allowed
                  if (value.length > 1) return;
                  setSelectedPlanId(value[0] ?? null);
                }}
              >
                <Fieldset.Root mt={3}>
                  <Fieldset.Legend fontSize="sm">
                    Available test plans
                  </Fieldset.Legend>

                  <Fieldset.Content>
                    {testPlansQuery.data.test_plans.map((plan: any) => (
                      <Checkbox.Root
                        key={plan.id}
                        value={plan.id.toString()}
                        disabled={
                          isLockedToPlan &&
                          plan.id.toString() !== effectivePlanId
                        }
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control />
                        <Checkbox.Label>{plan.description}</Checkbox.Label>
                      </Checkbox.Root>
                    ))}
                  </Fieldset.Content>
                </Fieldset.Root>
              </CheckboxGroup>
            ) : (
              <Text fontSize="sm" color="fg.subtle">
                No test plans available.
              </Text>
            )}

            {/* ASSIGN CTA */}
            <Button
              mt={4}
              size="sm"
              colorPalette="brand"
              disabled={!effectivePlanId}
              onClick={() => setAssignOpen(true)}
            >
              Assign testers
            </Button>

            {/* -------- Assigned testers preview (OPTIMISTIC) -------- */}
            <Box mt={4}>
              <Heading size="xs" mb={2} color="fg.heading">
                Assigned testers
              </Heading>

              {optimisticAssignment?.testers?.length ? (
                <Flex gap={2} wrap="wrap">
                  {optimisticAssignment.testers.map((uid) => {
                    const tester = testersQuery.data?.testers?.find(
                      (t: any) => t.user_id.toString() === uid,
                    );

                    return (
                      <Box
                        key={uid}
                        px={2}
                        py={1}
                        bg="bg.muted"
                        rounded="md"
                        fontSize="sm"
                        color="fg.muted"
                      >
                        {tester?.name ?? "Unknown"}
                      </Box>
                    );
                  })}
                </Flex>
              ) : (
                <Text fontSize="sm" color="fg.subtle">
                  No testers assigned yet.
                </Text>
              )}
            </Box>
          </Stack>

          {/* ===================== ASSIGN TESTERS DIALOG ===================== */}
          <AppDialog
            open={assignOpen}
            onOpenChange={() => setAssignOpen(false)}
            title="Assign testers"
            footer={
              <>
                <Button variant="outline" onClick={() => setAssignOpen(false)}>
                  Cancel
                </Button>

                <Button
                  colorPalette="brand"
                  disabled={selectedTesters.length === 0}
                  onClick={async () => {
                    if (!effectivePlanId) return;

                    const payload = {
                      project_id: Number(projectId),
                      test_plan_id: Number(effectivePlanId),
                      planned_tests: [
                        {
                          test_case_id: testCaseId,
                          user_ids: selectedTesters.map((id) => Number(id)),
                        },
                      ],
                    };

                    try {
                      await assignTestersToTestPlan(
                        effectivePlanId,
                        payload,
                      );

                      setOptimisticAssignment({
                        test_plan_id: effectivePlanId,
                        testers: selectedTesters,
                      });

                      setAssignOpen(false);
                    } catch (err) {
                      console.error("Failed to assign test case:", err);
                      alert("Failed to assign test case to test plan.");
                    }
                  }}
                >
                  Confirm assignment
                </Button>
              </>
            }
          >
            <CheckboxGroup
              value={selectedTesters}
              onValueChange={setSelectedTesters}
            >
              <Fieldset.Root>
                <Fieldset.Legend fontSize="sm">
                  Select at least one tester
                </Fieldset.Legend>

                <Fieldset.Content>
                  {testersQuery.data?.testers?.map((tester: any) => (
                    <Checkbox.Root
                      key={tester.user_id}
                      value={tester.user_id.toString()}
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control />
                      <Checkbox.Label>{tester.name}</Checkbox.Label>
                    </Checkbox.Root>
                  ))}
                </Fieldset.Content>
              </Fieldset.Root>
            </CheckboxGroup>
          </AppDialog>
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}
