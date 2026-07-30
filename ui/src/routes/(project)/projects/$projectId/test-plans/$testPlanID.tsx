import {
  createFileRoute,
  Link,
  Outlet,
  useMatchRoute,
} from "@tanstack/react-router";
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
  Select,
  createListCollection,
  Field,
  Portal,
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
import { useState, useEffect } from "react";
import { closeTestPlan, useTestPlanQuery, changeTestPlanEnvironment } from "@/services/TestPlanService";
import { MetricCard } from "@/components/ui/metric-card";
import { toaster } from "@/components/ui/toaster";
import { ErrorState, LoadingState } from "@/components/ui/page-states";
import { PageHeaderCard } from "@/components/ui/page-header-card";
import { TEST_PLAN_KINDS } from "@/common/constants/test-plan-kind";
import type { components } from "@/lib/api/v1";
import { formatHumanDateTime } from "@/lib/date-time";
import $api from "@/lib/api/query";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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

  const { data: envData } = $api.useQuery(
    "get",
    "/v1/projects/{projectID}/environments",
    { params: { path: { projectID: projectId } } }
  );
  const environments = envData?.environments ?? [];

  const [activeEnv, setActiveEnv] = useState<number | null>(null);
  useEffect(() => {
    if (testPlan?.environment_id) {
      setActiveEnv(testPlan.environment_id);
    }
  }, [testPlan?.environment_id]);

  const envOptions = createListCollection({
    items: environments.map((env) => ({
      label: env.name,
      value: String(env.id),
    })),
  });

  const handleEnvChange = async (envId: number) => {
    setActiveEnv(envId);
    try {
      await changeTestPlanEnvironment(Number(testPlanID), envId);
      toaster.success({ title: t("test_plans.env_update.success") });
      await refetch();
    } catch (err) {
      toaster.error({ title: t("test_plans.env_update.error") });
      console.error(err);
    }
  };

  const navItems: NavItem[] = [
    { label: t("test_plans.nav.overview"), path: "/projects/$projectId/test-plans/$testPlanID", exact: true },
    { label: t("test_plans.nav.execute"), path: "/projects/$projectId/test-plans/$testPlanID/execute" },
    { label: t("test_plans.nav.test_cases"), path: "/projects/$projectId/test-plans/$testPlanID/test-cases" },
    { label: t("test_plans.nav.test_runs"), path: "/projects/$projectId/test-plans/$testPlanID/test-runs" },
    { label: t("test_plans.nav.testers"), path: "/projects/$projectId/test-plans/$testPlanID/testers" },
  ];

  if (isLoading) return <LoadingState label={t("test_plans.loading")} />;
  if (error || !testPlan) return <ErrorState title={t("test_plans.error")} />;

  const handleMarkComplete = async () => {
    if (!testPlan.id) return;
    try {
      setIsClosing(true);
      await closeTestPlan(testPlan.id);
      await refetch();
      toaster.success({ title: t("test_plans.close.success") });
    } catch (closeError) {
      console.error("Failed to close test plan:", closeError);
      toaster.error({ title: t("test_plans.close.error") });
    } finally {
      setIsClosing(false);
    }
  };

  const kindLabel =
    (TEST_PLAN_KINDS[testPlan.kind as keyof typeof TEST_PLAN_KINDS] as string) ??
    testPlan.kind ??
    t("test_plans.not_available");

  const totalCases = testPlan.num_test_cases ?? 0;
  const passedCases = testPlan.passed_count ?? 0;
  const failedCases = testPlan.failed_count ?? 0;
  const pendingCases = testPlan.pending_count ?? 0;
  const assignedTesters = testPlan.assigned_testers ?? 0;

  return (
    <Box w="full">
      <PageHeaderCard
        title={testPlan.description?.trim() || t("test_plans.untitled", { id: testPlan.id })}
        description={t("test_plans.plan_description", { id: testPlan.id ?? t("test_plans.not_available"), kind: kindLabel })}
        badges={
          <>
            <Badge colorPalette={testPlan.is_complete ? "green" : "orange"} variant="subtle">
              <Icon as={testPlan.is_complete ? IconCheck : IconClock} />
              {testPlan.is_complete ? t("test_plans.status.completed") : t("test_plans.status.in_progress")}
            </Badge>
            <Badge colorPalette={testPlan.is_locked ? "red" : "gray"} variant="subtle">
              <Icon as={IconLock} />
              {testPlan.is_locked ? t("test_plans.status.locked") : t("test_plans.status.open")}
            </Badge>
            <Badge colorPalette={testPlan.has_report ? "blue" : "gray"} variant="subtle">
              {testPlan.has_report ? t("test_plans.report.available") : t("test_plans.report.none")}
            </Badge>
          </>
        }
        actions={
          <HStack gap={2} flexWrap="wrap">
            <Link to="/projects/$projectId/test-plans/$testPlanID/execute" params={{ projectId, testPlanID }}>
              <Button colorPalette="brand" variant="outline">
                <IconPlayerPlay />
                {t("test_plans.execute")}
              </Button>
            </Link>
            {testPlan.is_complete ? (
              <Button colorPalette="green" variant="subtle" disabled>
                <IconCheck />
                {t("test_plans.close.closed")}
              </Button>
            ) : (
              <Button
                colorPalette="green"
                loading={isClosing}
                disabled={isClosing}
                onClick={handleMarkComplete}
              >
                {t("test_plans.close.mark_complete")}
              </Button>
            )}
          </HStack>
        }
      />

      <Grid templateColumns={{ base: "repeat(2, minmax(0, 1fr))", lg: "repeat(5, minmax(0, 1fr))" }} gap={3} mb={6}>
        <MetricCard label={t("test_plans.metric.total")} value={totalCases} icon={IconListCheck} tone="brand" variant="emphasis" helperText={t("test_plans.metric.total_helper")} />
        <MetricCard label={t("test_plans.metric.passed")} value={passedCases} icon={IconCheck} tone="success" variant="subtle" helperText={t("test_plans.metric.passed_helper")} />
        <MetricCard label={t("test_plans.metric.failed")} value={failedCases} icon={IconX} tone="danger" variant="subtle" helperText={t("test_plans.metric.failed_helper")} />
        <MetricCard label={t("test_plans.metric.pending")} value={pendingCases} icon={IconClock} tone="warning" variant="subtle" helperText={t("test_plans.metric.pending_helper")} />
        <MetricCard label={t("test_plans.metric.assigned")} value={assignedTesters} icon={IconUsers} tone="info" helperText={t("test_plans.metric.assigned_helper")} />
      </Grid>

      {/* Environment selector */}
      <Card.Root border="sm" borderColor="border.subtle" bg="bg.surface" mb={6}>
        <Card.Body p={{ base: 3, md: 4 }}>
          <Field.Root>
            <Field.Label>{t("test_plans.active_env")}</Field.Label>
            <Select.Root
              collection={envOptions}
              value={activeEnv ? [String(activeEnv)] : []}
              onValueChange={(e) => handleEnvChange(Number(e.value[0]))}
            >
              <Select.HiddenSelect />
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder={t("test_plans.select_env")} />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                  <Select.ClearTrigger />
                </Select.IndicatorGroup>
              </Select.Control>
              <Portal>
                <Select.Positioner>
                  <Select.Content>
                    {envOptions.items.map((item) => (
                      <Select.Item key={item.value} item={item}>
                        {item.label}
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
            <Field.HelperText>
              {t("test_plans.env_helper")}
            </Field.HelperText>
          </Field.Root>
        </Card.Body>
      </Card.Root>

      {/* Dates */}
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
            <DetailItem label={t("test_plans.detail.start_date")} value={formatHumanDateTime(testPlan.start_at)} />
            <DetailItem label={t("test_plans.detail.end_date")} value={formatHumanDateTime(testPlan.scheduled_end_at)} />
            <DetailItem label={t("test_plans.detail.closed_at")} value={formatHumanDateTime(testPlan.closed_at)} />
            <DetailItem label={t("test_plans.detail.updated_at")} value={formatHumanDateTime(testPlan.updated_at)} />
          </Grid>
        </Card.Body>
      </Card.Root>

      {/* Navigation tabs */}
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
                <Link key={item.label} to={item.path} params={{ projectId, testPlanID }}>
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
