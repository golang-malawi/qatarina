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
} from "@chakra-ui/react";

import { useTestCaseQuery } from "@/services/TestCaseService";
import { useProjectTestPlansQuery } from "@/services/TestPlanService";
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

  const testCase = data?.test_case;
  if (!testCase) return <div>No data found</div>;

  /** ---------- DERIVED ---------- */
  const effectivePlanId = optimisticAssignment?.test_plan_id ?? selectedPlanId;

  const isLockedToPlan =
    testCase.is_assigned_to_test_plan || !!optimisticAssignment?.test_plan_id;

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
          <Tabs.Trigger value="metadata">Metadata</Tabs.Trigger>
          <Tabs.Trigger value="tags">Tags</Tabs.Trigger>
          <Tabs.Trigger value="documents">Documents</Tabs.Trigger>
          <Tabs.Trigger value="usage">Usage & Assignment</Tabs.Trigger>
        </Tabs.List>

        {/* DESCRIPTION */}
        <Tabs.Content value="description">
          <p>{testCase.description || "No description"}</p>
        </Tabs.Content>

        {/* METADATA */}
        <Tabs.Content value="metadata">
          <div className="space-y-2 text-sm">
            <p>
              <strong>Type:</strong> {testCase.kind}
            </p>
            <p>
              <strong>Created By:</strong> User ID {testCase.created_by}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              {testCase.is_draft ? "Draft" : "Published"}
            </p>
            <p>
              <strong>Created At:</strong>{" "}
              {new Date(testCase.created_at).toLocaleString()}
            </p>
            <p>
              <strong>Updated At:</strong>{" "}
              {new Date(testCase.updated_at).toLocaleString()}
            </p>
          </div>
        </Tabs.Content>

        {/* TAGS */}
        <Tabs.Content value="tags">
          {testCase.tags?.length ? (
            <Flex gap={2} wrap="wrap">
              {testCase.tags.map((tag: string) => (
                <Box key={tag} px={3} py={1} bg="gray.200" rounded="md">
                  {tag}
                </Box>
              ))}
            </Flex>
          ) : (
            <Text>No tags</Text>
          )}
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
                        isDisabled={
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
              isDisabled={!effectivePlanId}
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
                      isDisabled={selectedTesters.length === 0}
                      onClick={() => {
                        setOptimisticAssignment({
                          test_plan_id: effectivePlanId,
                          testers: selectedTesters,
                        });

                        /**
                         * TODO 
                         * POST /test-plans/:id/test-cases
                         * {
                         *   test_case_id,
                         *   user_ids
                         * }
                         */

                        setAssignOpen(false);
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
