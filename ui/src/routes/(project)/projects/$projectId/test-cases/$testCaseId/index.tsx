import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
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
  Code,
  Badge,
} from "@chakra-ui/react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

import { AppDialog } from "@/components/ui/app-dialog";
import { useTestCaseQuery, branchTestCase } from "@/services/TestCaseService";
import {
  useProjectTestPlansQuery,
  assignTestersToTestPlan,
} from "@/services/TestPlanService";
import { useTestersQuery } from "@/services/TesterService";
import { toaster } from "@/components/ui/toaster";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-cases/$testCaseId/",
)({
  component: ViewTestCase,
  validateSearch: (search: { tab?: string }) => search,
});

function ViewTestCase() {
  const { projectId, testCaseId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const activeTab = search.tab ?? "description";

  const { data: testCase, isLoading, error } = useTestCaseQuery(testCaseId);
  const testPlansQuery = useProjectTestPlansQuery(projectId);
  const testersQuery = useTestersQuery();

  /** ---------- STATE ---------- */
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedTesters, setSelectedTesters] = useState<string[]>([]);

  /** Optimistic UI state for tester assignment */
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

  if (error) {
    return <Text color="fg.error">Error loading test case</Text>;
  }

  if (!testCase) {
    return <Text color="fg.muted">No data found</Text>;
  }

  /** ---------- DERIVED ---------- */
  const effectivePlanId = optimisticAssignment?.test_plan_id ?? selectedPlanId;
  const isLockedToPlan = !!optimisticAssignment?.test_plan_id;

  const handleTabChange = (details: { value: string }) => {
    navigate({
      to: "/projects/$projectId/test-cases/$testCaseId",
      params: { projectId, testCaseId },
      search: { tab: details.value },
      replace: true,
    });
  };

  return (
    <Box
      p={6}
      bg="bg.surface"
      border="1px solid"
      borderColor="border.subtle"
      borderRadius="xl"
      shadow="card"
      display="flex"
      flexDirection="column"
      gap={6}
    >
      {/* Header */}
      <Stack gap={2}>
        <Flex justify="space-between" align="flex-start" wrap="wrap" gap={4}>
          <Box>
            <Heading size="lg" color="fg.heading">
              {testCase.title}
            </Heading>
            <Text fontSize="sm" color="fg.subtle" mt={1}>
              Code: <strong>{testCase.code}</strong> • Feature:{" "}
              <strong>{testCase.feature_or_module}</strong>
            </Text>
            <Text fontSize="sm" color="fg.subtle">
              Project ID: {projectId}
            </Text>
          </Box>

          {/* Action Buttons */}
          <Flex gap={2}>
            <Button
              size="sm"
              colorPalette="brand"
              onClick={async () => {
                try {
                  const branched = await branchTestCase(testCaseId);
                  const newId = branched?.data?.id;

                  if (!newId) {
                    throw new Error(
                      "Branching did not return a new test case ID",
                    );
                  }

                  toaster.success({
                    title: t("test_cases.branch.success"),
                    description: t("test_cases.branch.success_description"),
                  });

                  navigate({
                    to: "/projects/$projectId/test-cases/$testCaseId/edit",
                    params: { projectId, testCaseId: newId },
                    search: { isBranched: true },
                  });
                } catch (err: any) {
                  toaster.error({
                    title: t("test_cases.branch.error"),
                    description:
                      err?.message || "Could not branch test case.",
                  });
                }
              }}
            >
              {t("test_cases.branch", "Branch")}
            </Button>
          </Flex>
        </Flex>
      </Stack>

      {/* Tabs */}
      <Tabs.Root value={activeTab} onValueChange={handleTabChange}>
        <Tabs.List>
          <Tabs.Trigger value="description">Description</Tabs.Trigger>
          <Tabs.Trigger value="usage">Usage & Assignment</Tabs.Trigger>
        </Tabs.List>

        {/* DESCRIPTION TAB */}
        <Tabs.Content value="description">
          <Stack gap={4} mt={4}>
            <Box
              p={4}
              bg="bg.subtle"
              rounded="lg"
              border="1px solid"
              borderColor="border.subtle"
            >
              {testCase.description ? (
                <ReactMarkdown
                  components={{
                    h1: (props) => <Heading size="lg" mb={2} {...props} />,
                    h2: (props) => <Heading size="md" mb={2} {...props} />,
                    h3: (props) => <Heading size="sm" mb={2} {...props} />,
                    p: (props) => <Text mb={2} {...props} />,
                    code: (props) => <Code colorPalette="yellow" {...props} />,
                    ul: (props) => (
                      <ul
                        style={{ paddingLeft: "1.25rem", listStyleType: "disc" }}
                        {...props}
                      />
                    ),
                    ol: (props) => (
                      <ol
                        style={{
                          paddingLeft: "1.25rem",
                          listStyleType: "decimal",
                        }}
                        {...props}
                      />
                    ),
                    li: (props) => (
                      <li style={{ marginBottom: "0.25rem" }} {...props} />
                    ),
                    blockquote: (props) => (
                      <blockquote
                        style={{
                          paddingLeft: "1rem",
                          borderLeft: "4px solid var(--chakra-colors-border-emphasized)",
                          color: "var(--chakra-colors-fg-muted)",
                          fontStyle: "italic",
                          margin: "0.5rem 0",
                        }}
                        {...props}
                      />
                    ),
                    a: (props) => (
                      <a
                        style={{
                          color: "var(--chakra-colors-brand-solid)",
                          textDecoration: "underline",
                        }}
                        {...props}
                      />
                    ),
                  }}
                >
                  {testCase.description}
                </ReactMarkdown>
              ) : (
                <Text color="fg.subtle">No description provided.</Text>
              )}
            </Box>

            {/* Tags */}
            <Box>
              {testCase.tags?.length ? (
                <Flex gap={2} wrap="wrap">
                  {testCase.tags.map((tag: string) => (
                    <Badge key={tag} colorPalette="brand" variant="subtle">
                      {tag}
                    </Badge>
                  ))}
                </Flex>
              ) : (
                <Text fontSize="sm" color="fg.subtle">
                  No tags attached.
                </Text>
              )}
            </Box>

            {/* Metadata */}
            <Box
              p={4}
              bg="bg.surface"
              rounded="md"
              border="1px solid"
              borderColor="border.subtle"
              shadow="sm"
            >
              <Stack gap={2.5} fontSize="sm" color="fg.muted">
                <Flex justify="space-between">
                  <Text fontWeight="semibold">Type:</Text>
                  <Text>{testCase.kind ?? "Manual"}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text fontWeight="semibold">Created By:</Text>
                  <Text>User ID {testCase.created_by ?? "N/A"}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text fontWeight="semibold">Status:</Text>
                  <Badge colorPalette={testCase.is_draft ? "yellow" : "green"}>
                    {testCase.is_draft ? "Draft" : "Published"}
                  </Badge>
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
                {testCase.parent_test_case_id && (
                  <Flex justify="space-between">
                    <Text fontWeight="semibold">Branched From:</Text>
                    <Link
                      to="/projects/$projectId/test-cases/$testCaseId"
                      params={{
                        projectId,
                        testCaseId: testCase.parent_test_case_id,
                      }}
                      style={{
                        color: "var(--chakra-colors-brand-solid)",
                        textDecoration: "underline",
                      }}
                    >
                      {testCase.parent_code ?? testCase.parent_test_case_id} —{" "}
                      {testCase.parent_title ?? "Parent Test Case"}
                    </Link>
                  </Flex>
                )}
              </Stack>
            </Box>
          </Stack>
        </Tabs.Content>

       {/* USAGE & ASSIGNMENT TAB */}
        <Tabs.Content value="usage">
          <Stack mt={4} gap={4}>
            <Heading size="sm" color="fg.heading">
              Assign to Test Plan
            </Heading>

            <Alert.Root status="info">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description>
                  A test case can belong to more than one test plan.
                </Alert.Description>
              </Alert.Content>
            </Alert.Root>

            {/* Test Plans Checkbox Group */}
            {testPlansQuery.data?.test_plans?.length ? (
              <CheckboxGroup
                value={effectivePlanId ? [effectivePlanId] : []}
                onValueChange={(value) => {
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
            <Box>
              <Button
                mt={2}
                size="sm"
                colorPalette="brand"
                disabled={!effectivePlanId}
                onClick={() => setAssignOpen(true)}
              >
                Assign testers
              </Button>
            </Box>

            {/* Assigned Testers Preview */}
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
                        px={3}
                        py={1}
                        bg="bg.muted"
                        rounded="md"
                        fontSize="sm"
                        color="fg.muted"
                      >
                        {tester?.name ?? `User ID: ${uid}`}
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

          {/* Dialog Modal for Tester Assignment */}
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
                      await assignTestersToTestPlan(effectivePlanId, payload);
                      setOptimisticAssignment({
                        test_plan_id: effectivePlanId,
                        testers: selectedTesters,
                      });
                      setAssignOpen(false);
                      toaster.success({
                        title: "Assignment successful",
                        description: "Test case assigned to plan and testers.",
                      });
                      navigate({
                        to: "/projects/$projectId/test-cases",
                        params: { projectId },
                      });
                    } catch (err: any) {
                      console.error("Failed to assign test case:", err);
                      toaster.error({
                        title: "Assignment failed",
                        description:
                          err?.message || "Could not assign test case to plan.",
                      });
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
                <Fieldset.Content gap={2} mt={2}>
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