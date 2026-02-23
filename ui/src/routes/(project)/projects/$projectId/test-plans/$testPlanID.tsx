import { createFileRoute, Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import {
  Badge,
  Box,
  Button,
  Card,
  Grid,
  HStack,
  Icon,
  Separator,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  IconCheck,
  IconClock,
  IconListCheck,
  IconLock,
  IconPlayerPlay,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import { useState } from "react";
import { closeTestPlan, useTestPlanQuery } from "@/services/TestPlanService";
import { MetricCard } from "@/components/ui/metric-card";
import { toaster } from "@/components/ui/toaster";
import { ErrorState, LoadingState } from "@/components/ui/page-states";
import { PageHeaderCard } from "@/components/ui/page-header-card";
import { TEST_PLAN_KINDS } from "@/common/constants/test-plan-kind";
import type { components } from "@/lib/api/v1";
import { formatHumanDateTime } from "@/lib/date-time";

type TestPlanData = components["schemas"]["schema.TestPlanResponseItem"];

type NavItem = {
  label: string;
  path:
    | "/projects/$projectId/test-plans/$testPlanID"
    | "/projects/$projectId/test-plans/$testPlanID/execute"
    | "/projects/$projectId/test-plans/$testPlanID/test-cases"
    | "/projects/$projectId/test-plans/$testPlanID/test-runs"
    | "/projects/$projectId/test-plans/$testPlanID/testers";
  exact?: boolean;
};

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-plans/$testPlanID"
)({
  component: ViewTestPlan,
});

function ViewTestPlan() {
  const { projectId, testPlanID } = Route.useParams();
  const [isClosing, setIsClosing] = useState(false);
  const matchRoute = useMatchRoute();

  const {
    data: testPlan,
    isLoading,
    error,
    refetch,
  } = useTestPlanQuery(testPlanID) as {
    data: TestPlanData | undefined;
    isLoading: boolean;
    error: unknown;
    refetch: () => Promise<unknown>;
  };

  const navItems: NavItem[] = [
    {
      label: "Overview",
      path: "/projects/$projectId/test-plans/$testPlanID",
      exact: true,
    },
    {
      label: "Execute",
      path: "/projects/$projectId/test-plans/$testPlanID/execute",
    },
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

  if (isLoading) return <LoadingState label="Loading test plan..." />;
  if (error || !testPlan) return <ErrorState title="Error loading test plan" />;

  const handleMarkComplete = async () => {
    if (!testPlan.id) return;

    try {
      setIsClosing(true);
      await closeTestPlan(testPlan.id);
      await refetch();
      toaster.success({ title: "Test plan closed successfully" });
    } catch (closeError) {
      console.error("Failed to close test plan:", closeError);
      toaster.error({ title: "Failed to close test plan" });
    } finally {
      setIsClosing(false);
    }
  };

  const kindLabel =
    (TEST_PLAN_KINDS[testPlan.kind as keyof typeof TEST_PLAN_KINDS] as string) ??
    testPlan.kind ??
    "N/A";
  const totalCases = testPlan.num_test_cases ?? 0;
  const passedCases = testPlan.passed_count ?? 0;
  const failedCases = testPlan.failed_count ?? 0;
  const pendingCases = testPlan.pending_count ?? 0;
  const assignedTesters = testPlan.assigned_testers ?? 0;

  return (
    <Box w="full">
      <PageHeaderCard
        title={testPlan.description?.trim() || `Test Plan #${testPlan.id}`}
        description={`Plan ID: ${testPlan.id ?? "N/A"} · Kind: ${kindLabel}`}
        badges={
          <>
            <Badge
              colorPalette={testPlan.is_complete ? "green" : "orange"}
              variant="subtle"
            >
              <Icon as={testPlan.is_complete ? IconCheck : IconClock} />
              {testPlan.is_complete ? "Completed" : "In Progress"}
            </Badge>
            <Badge
              colorPalette={testPlan.is_locked ? "red" : "gray"}
              variant="subtle"
            >
              <Icon as={IconLock} />
              {testPlan.is_locked ? "Locked" : "Open"}
            </Badge>
            <Badge colorPalette={testPlan.has_report ? "blue" : "gray"} variant="subtle">
              {testPlan.has_report ? "Report available" : "No report yet"}
            </Badge>
          </>
        }
        actions={
          <HStack gap={2} flexWrap="wrap">
            <Link
              to="/projects/$projectId/test-plans/$testPlanID/execute"
              params={{ projectId, testPlanID }}
            >
              <Button colorPalette="brand" variant="outline">
                <IconPlayerPlay />
                Execute
              </Button>
            </Link>
            {testPlan.is_complete ? (
              <Button colorPalette="green" variant="subtle" disabled>
                <IconCheck />
                Plan Closed
              </Button>
            ) : (
              <Button
                colorPalette="green"
                loading={isClosing}
                disabled={isClosing}
                onClick={handleMarkComplete}
              >
                Mark as Complete
              </Button>
            )}
          </HStack>
        }
      />

      <Grid
        templateColumns={{
          base: "repeat(2, minmax(0, 1fr))",
          lg: "repeat(5, minmax(0, 1fr))",
        }}
        gap={3}
        mb={6}
      >
        <MetricCard
          label="Total Cases"
          value={totalCases}
          icon={IconListCheck}
          tone="brand"
          variant="emphasis"
          helperText="Cases scoped"
        />
        <MetricCard
          label="Passed"
          value={passedCases}
          icon={IconCheck}
          tone="success"
          variant="subtle"
          helperText="Successful validations"
        />
        <MetricCard
          label="Failed"
          value={failedCases}
          icon={IconX}
          tone="danger"
          variant="subtle"
          helperText="Requires fixes"
        />
        <MetricCard
          label="Pending"
          value={pendingCases}
          icon={IconClock}
          tone="warning"
          variant="subtle"
          helperText="Awaiting execution"
        />
        <MetricCard
          label="Assigned Testers"
          value={assignedTesters}
          icon={IconUsers}
          tone="info"
          helperText="People on this plan"
        />
      </Grid>

      <Card.Root border="sm" borderColor="border.subtle" bg="bg.surface" mb={6}>
        <Card.Body p={{ base: 4, md: 5 }}>
          <Grid
            templateColumns={{
              base: "1fr",
              md: "repeat(2, minmax(0, 1fr))",
              xl: "repeat(4, minmax(0, 1fr))",
            }}
            gap={4}
          >
            <DetailItem
              label="Start Date"
              value={formatHumanDateTime(testPlan.start_at)}
            />
            <DetailItem
              label="Scheduled End"
              value={formatHumanDateTime(testPlan.scheduled_end_at)}
            />
            <DetailItem
              label="Closed At"
              value={formatHumanDateTime(testPlan.closed_at)}
            />
            <DetailItem
              label="Updated At"
              value={formatHumanDateTime(testPlan.updated_at)}
            />
          </Grid>
        </Card.Body>
      </Card.Root>

      <Card.Root border="sm" borderColor="border.subtle" bg="bg.surface" mb={6}>
        <Card.Body p={{ base: 3, md: 4 }}>
          <HStack gap={2} overflowX="auto" align="stretch">
            {navItems.map((item) => {
              const isActive = Boolean(
                matchRoute({
                  to: item.path as any,
                  params: { projectId, testPlanID },
                  fuzzy: item.exact ? false : true,
                })
              );

              return (
                <Link
                  key={item.label}
                  to={item.path}
                  params={{ projectId, testPlanID }}
                >
                  <Button
                    variant={isActive ? "solid" : "ghost"}
                    colorPalette={isActive ? "brand" : "gray"}
                    size="sm"
                  >
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </HStack>
          <Separator mt={4} />
        </Card.Body>
      </Card.Root>

      <Outlet />
    </Box>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap={1}>
      <Text fontSize="xs" color="fg.subtle">
        {label}
      </Text>
      <Text fontWeight="medium" color="fg.default">
        {value}
      </Text>
    </Stack>
  );
}
