import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useTestPlanQuery } from "@/services/TestPlanService";
import {
  Box,
  Heading,
  Text,
  Stack,
  Badge,
  Button,
  Flex,
  Stat,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { TEST_PLAN_KINDS } from "@/common/constants/test-plan-kind";
/**
 * Test plan type – MATCHES API RESPONSE EXACTLY
 */
type TestPlanData = {
  id: number;
  project_id: number;
  assigned_to_id: number;
  created_by_id: number;
  updated_by_id: number;
  kind: string;
  description: string;
  start_at: string;
  closed_at: string;
  scheduled_end_at: string;
  num_test_cases: number;
  num_failures: number;
  passed_count: number;
  failed_count: number;
  pending_count: number;
  assigned_testers: number;
  is_complete: boolean;
  is_locked: boolean;
  has_report: boolean;
  created_at: string;
  updated_at: string;
  test_cases: {
    id: string;
    title: string;
    assigned_tester_ids: number[];
  }[];
};

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-plans/$testPlanID"
)({
  component: ViewTestPlan,
});

function ViewTestPlan() {
  const { projectId, testPlanID } = Route.useParams();

  /**
   * Fetch test plan
   */
  const {
    data: initialTestPlan,
    isLoading,
    error,
  } = useTestPlanQuery(testPlanID) as {
    data: TestPlanData | undefined;
    isLoading: boolean;
    error: unknown;
  };

  /**
   * Local state synced from query
   */
  const [testPlan, setTestPlan] = useState<TestPlanData | null>(null);

  useEffect(() => {
    if (initialTestPlan) {
      setTestPlan(initialTestPlan);
    }
  }, [initialTestPlan]);

  /**
   * Mock actions (UI-only)
   */
  const handleMarkComplete = () => {
    if (!testPlan) return;

    setTestPlan({
      ...testPlan,
      is_complete: true,
      updated_at: new Date().toISOString(),
    });
  };

  const handleMarkInProgress = () => {
    if (!testPlan) return;

    setTestPlan({
      ...testPlan,
      is_complete: false,
      updated_at: new Date().toISOString(),
    });
  };

  /**
   * Navigation tabs
   */
  const navItems = [
    {
      label: "Test Cases",
      path: "/projects/$projectId/test-plans/$testPlanID/test-cases",
    },
    {
      label: "Test Runs",
      path: "/projects/$projectId/test-plans/$testPlanID/test-runs",
    },
    {
      label: "Testers",
      path: "/projects/$projectId/test-plans/$testPlanID/testers",
    },
  ];

  /**
   * Loading / Error guards
   */
  if (isLoading) return <div>Loading...</div>;
  if (error || !testPlan) return <div>Error loading test plan</div>;

  const isComplete = testPlan.is_complete;

  const totalTestCases = testPlan.num_test_cases ?? 0;

  return (
    <Box p={6}>
      <Heading mb={4}>Test Plan Details</Heading>

      {/* Navigation */}
      <Flex
        gap="2"
        borderBottom="1px solid"
        borderColor="gray.200"
        bg="gray.50"
        overflowX="auto"
        mb={4}
      >
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            params={{ projectId, testPlanID }}
          >
            <Button variant="ghost" colorScheme="teal" size="sm">
              {item.label}
            </Button>
          </Link>
        ))}
      </Flex>

      <Flex gap={10} wrap="wrap">
        {/* LEFT COLUMN */}
        <Stack gap={3} flex={1} minW="280px">
          <Text>
            <strong>ID:</strong> {testPlan.id}
          </Text>

          <Text>
            <strong>Kind:</strong>{" "}
            {(TEST_PLAN_KINDS[testPlan.kind as keyof typeof TEST_PLAN_KINDS] as string) ?? testPlan.kind}
          </Text>

          <Text>
            <strong>Description:</strong> {testPlan.description}
          </Text>

          {/* Status + Actions */}
          <Flex align="center" gap={3}>
            <Text>
              <strong>Status:</strong>{" "}
              <Badge colorScheme={isComplete ? "green" : "orange"}>
                {isComplete ? "Complete" : "In Progress"}
              </Badge>
            </Text>

            {isComplete ? (
              <Button
                onClick={handleMarkInProgress}
                size="xs"
                variant="outline"
                colorScheme="orange"
              >
                Mark as In Progress
              </Button>
            ) : (
              <Button
                onClick={handleMarkComplete}
                size="xs"
                colorScheme="green"
              >
                Mark as Complete
              </Button>
            )}
          </Flex>

          {/* Stats */}
          <Flex gap={6} wrap="wrap" mt={4}>
            <Stat.Root maxW="200px">
              <Stat.Label>Total Test Cases</Stat.Label>
              <Stat.ValueText>{totalTestCases}</Stat.ValueText>
            </Stat.Root>

            <Stat.Root maxW="200px">
              <Stat.Label>Passed Test Cases</Stat.Label>
              <Stat.ValueText>
                {testPlan.passed_count}
              </Stat.ValueText>
            </Stat.Root>

            <Stat.Root maxW="200px">
              <Stat.Label>Failed Test Cases</Stat.Label>
              <Stat.ValueText>{testPlan.failed_count}</Stat.ValueText>
            </Stat.Root>

            <Stat.Root maxW="200px">
              <Stat.Label>Testers Assigned</Stat.Label>
              <Stat.ValueText>{testPlan.assigned_testers}</Stat.ValueText>
            </Stat.Root>
          </Flex>
        </Stack>

        {/* RIGHT COLUMN */}
        <Stack gap={3} flex={1} minW="280px">
          <Text>
            <strong>Start Date:</strong>{" "}
            {new Date(testPlan.start_at).toLocaleString()}
          </Text>

          <Text>
            <strong>Scheduled End:</strong>{" "}
            {new Date(testPlan.scheduled_end_at).toLocaleString()}
          </Text>

          <Text>
            <strong>Locked:</strong> {testPlan.is_locked ? "Yes" : "No"}
          </Text>

          <Text>
            <strong>Has Report:</strong> {testPlan.has_report ? "Yes" : "No"}
          </Text>
        </Stack>
      </Flex>

      <Box mt={6}>
        <Outlet />
      </Box>
    </Box>
  );
}
