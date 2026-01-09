import { createFileRoute } from "@tanstack/react-router";
import {
  Tabs,
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Dialog,
  Fieldset,
  Heading,
  Portal,
  Text,
  Flex,
  Alert,
  Stack
} from "@chakra-ui/react";

import { useTestCaseQuery } from "@/services/TestCaseService";
import { useProjectTestPlansQuery } from "@/services/TestPlanService";
import { assignTestersToTestPlan } from "@/services/TestPlanService";
import { useTestersQuery } from "@/services/TesterService";
import { useState } from "react";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-cases/$testCaseId/"
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

  if (isLoading) return <div>Loading test case...</div>;
  if (error) return <div>Error loading test case</div>;

  const testCase = data;
  if (!testCase) return <div>No data found</div>;

  /** ---------- DERIVED ---------- */
  const effectivePlanId = optimisticAssignment?.test_plan_id ?? selectedPlanId;

  const isLockedToPlan = !!optimisticAssignment?.test_plan_id;

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">{testCase.title}</h1>
        <p className="text-sm text-muted">
          Code: {testCase.code} • Feature: {testCase.feature_or_module}
        </p>
        <p className="text-sm text-muted">Project ID: {projectId}</p>
      </div>

      <Tabs.Root defaultValue="description">
        <Tabs.List>
          <Tabs.Trigger value="description">Description</Tabs.Trigger>
          {/* <Tabs.Trigger value="metadata">Metadata</Tabs.Trigger>
          <Tabs.Trigger value="tags">Tags</Tabs.Trigger>
          <Tabs.Trigger value="documents">Documents</Tabs.Trigger> */}
          <Tabs.Trigger value="usage">Usage & Assignment</Tabs.Trigger>
        </Tabs.List>

        {/* DESCRIPTION */}
        {/* DESCRIPTION */}
        <Tabs.Content value="description">
          <Box p={4} bg="gray.50" rounded="md" shadow="sm">
            {/* Description */}
            <Text mb={3} color="gray.700">
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
                      bg="teal.100"
                      color="teal.800"
                      fontSize="xs"
                      fontWeight="medium"
                      rounded="full"
                    >
                      {tag}
                    </Box>
                  ))}
                </Flex>
              ) : (
                <Text fontSize="sm" color="gray.500">
                  No tags
                </Text>
              )}
            </Box>

            {/* Metadata */}
            <Box
              p={3}
              bg="white"
              rounded="md"
              borderWidth={1}
              borderColor="gray.200"
              shadow="xs"
            >
              <Stack gap={2} fontSize="sm" color="gray.600">
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
                  <Text color={testCase.is_draft ? "orange.500" : "green.500"}>
                    {testCase.is_draft ? "Draft" : "Published"}
                  </Text>
                </Flex>

                <Flex justify="space-between">
                  <Text fontWeight="semibold">Created At:</Text>
                  <Text>{testCase.created_at ? new Date(testCase.created_at).toLocaleString() : "N/A"}</Text>
                </Flex>

                <Flex justify="space-between">
                  <Text fontWeight="semibold">Updated At:</Text>
                  <Text>{testCase.updated_at ? new Date(testCase.updated_at).toLocaleString() : "N/A"}</Text>
                </Flex>
              </Stack>
            </Box>
          </Box>
        </Tabs.Content>

        {/* DOCUMENTS */}
        <Tabs.Content value="documents">
          <Text>No documents uploaded yet.</Text>
        </Tabs.Content>

        {/* ===================== USAGE & ASSIGNMENT ===================== */}
        <Tabs.Content value="usage">
          <Box mt={4} spaceY={4}>
            <Heading size="sm">Assign to Test Plan</Heading>
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
              <Text fontSize="sm" color="gray.500">
                No test plans available.
              </Text>
            )}

            {/* ASSIGN CTA */}
            <Button
              mt={4}
              size="sm"
              disabled={!effectivePlanId}
              onClick={() => setAssignOpen(true)}
            >
              Assign testers
            </Button>

            {/* -------- Assigned testers preview (OPTIMISTIC) -------- */}
            <Box mt={4}>
              <Heading size="xs" mb={2}>
                Assigned testers
              </Heading>

              {optimisticAssignment?.testers?.length ? (
                <Flex gap={2} wrap="wrap">
                  {optimisticAssignment.testers.map((uid) => {
                    const tester = testersQuery.data?.testers?.find(
                      (t: any) => t.user_id.toString() === uid
                    );

                    return (
                      <Box
                        key={uid}
                        px={2}
                        py={1}
                        bg="gray.100"
                        rounded="md"
                        fontSize="sm"
                      >
                        {tester?.name ?? "Unknown"}
                      </Box>
                    );
                  })}
                </Flex>
              ) : (
                <Text fontSize="sm" color="gray.500">
                  No testers assigned yet.
                </Text>
              )}
            </Box>
          </Box>

          {/* ===================== ASSIGN TESTERS DIALOG ===================== */}
          <Dialog.Root
            open={assignOpen}
            onOpenChange={() => setAssignOpen(false)}
          >
            <Portal>
              <Dialog.Backdrop />
              <Dialog.Positioner>
                <Dialog.Content>
                  <Dialog.Header>Assign testers</Dialog.Header>

                  <Dialog.Body>
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
                  </Dialog.Body>

                  <Dialog.Footer>
                    <Button
                      variant="outline"
                      onClick={() => setAssignOpen(false)}
                    >
                      Cancel
                    </Button>

                    <Button
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
                            payload
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
                  </Dialog.Footer>
                </Dialog.Content>
              </Dialog.Positioner>
            </Portal>
          </Dialog.Root>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
