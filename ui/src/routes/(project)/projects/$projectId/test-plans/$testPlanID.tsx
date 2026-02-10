import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useTestPlanQuery } from "@/services/TestPlanService";
import { closeTestPlan } from "@/services/TestPlanService";
import {
  Box,
  Heading,
  Text,
  Stack,
  Badge,
  Button,
  Flex,
  Stat,
  Spinner,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { toaster } from "@/components/ui/toaster";
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
    refetch,
  } = useTestPlanQuery(testPlanID) as {
    data: TestPlanData | undefined;
    isLoading: boolean;
    error: unknown;
    refetch: () => void;
  };

  /**
   * Local state synced from query
   */
  const [testPlan, setTestPlan] = useState<TestPlanData | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (initialTestPlan) {
      setTestPlan(initialTestPlan);
    }
  }, [initialTestPlan]);

  /**
   * Close test plan via API
   */
  const handleMarkComplete = async () => {
    if (!testPlan) return;

    try {
      setIsClosing(true);
      await closeTestPlan(testPlan.id);

      // Force refetch to get latest data from server
      await refetch();
      
      toaster.success({
        title: "Test plan closed successfully",
      });
    } catch (error: any) {
      console.error("Failed to close test plan:", error);
      
      toaster.error({
        title: "Failed to close test plan",
      });
    } finally {
      setIsClosing(false);
    }
  };

  /**
   * Mark test plan as in progress
   */
  const handleMarkInProgress = async () => {
    if (!testPlan) return;

    try {
      setIsClosing(true);
      // Note: You may need to add an API endpoint for this too if it doesn't exist
      // For now, assuming the UI just manages this locally
      setTestPlan({
        ...testPlan,
        is_complete: false,
        closed_at: "",
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to mark as in progress:", error);
      alert("Failed to mark as in progress. Please try again.");
    } finally {
      setIsClosing(false);
    }
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
  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="40">
        <Spinner size="xl" color="brand.solid" />
      </Flex>
    );
  }
  if (error || !testPlan) {
    return <Text color="fg.error">Error loading test plan</Text>;
  }

  const isComplete = testPlan.is_complete;

  const totalTestCases = testPlan.num_test_cases ?? 0;

  return (
    <Box p={6}>
      <Heading mb={4} color="fg.heading">
        Test Plan Details
      </Heading>

      {/* Navigation */}
      <Flex
        gap="2"
        borderBottom="sm"
        borderColor="border.subtle"
        bg="bg.surface"
        overflowX="auto"
        mb={4}
      >
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            params={{ projectId, testPlanID }}
          >
            <Button variant="ghost" colorPalette="brand" size="sm">
              {item.label}
            </Button>
          </Link>
        ))}
      </Flex>

      <Flex gap={10} wrap="wrap">
        {/* LEFT COLUMN */}
        <Stack gap={3} flex={1} minW="72" color="fg.muted">
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
              <Badge
                colorPalette={isComplete ? "success" : "warning"}
                variant="subtle"
              >
                {isComplete ? "Complete" : "In Progress"}
              </Badge>
            </Text>

            {isComplete ? (
              <Button
                onClick={handleMarkInProgress}
                size="xs"
                variant="outline"
                colorScheme="orange"
                loading={isClosing}
                disabled={isClosing}
              >
                Mark as In Progress
              </Button>
            ) : (
              <Button
                onClick={handleMarkComplete}
                size="xs"
                loading={isClosing}
                disabled={isClosing}
                colorPalette="success"
              >
                Mark as Complete
              </Button>
            )}
          </Flex>

          {/* Stats */}
          <Flex gap={6} wrap="wrap" mt={4}>
            <Stat.Root maxW="48">
              <Stat.Label>Total Test Cases</Stat.Label>
              <Stat.ValueText>{totalTestCases}</Stat.ValueText>
            </Stat.Root>

            <Stat.Root maxW="48">
              <Stat.Label>Passed Test Cases</Stat.Label>
              <Stat.ValueText>
                {testPlan.passed_count}
              </Stat.ValueText>
            </Stat.Root>

            <Stat.Root maxW="48">
              <Stat.Label>Failed Test Cases</Stat.Label>
              <Stat.ValueText>{testPlan.failed_count}</Stat.ValueText>
            </Stat.Root>

            <Stat.Root maxW="48">
              <Stat.Label>Testers Assigned</Stat.Label>
              <Stat.ValueText>{testPlan.assigned_testers}</Stat.ValueText>
            </Stat.Root>
          </Flex>
        </Stack>

        {/* RIGHT COLUMN */}
        <Stack gap={3} flex={1} minW="72" color="fg.muted">
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
