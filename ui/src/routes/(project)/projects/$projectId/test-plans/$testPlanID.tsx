import {
  createFileRoute,
  Link,
  Outlet,
  useMatchRoute,
} from "@tanstack/react-router";
import {
  Alert,
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
  IconDownload,
  IconFileText,
  IconListCheck,
  IconLock,
  IconLockOpen,
  IconPlayerPlay,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import { useState, useEffect } from "react";
import {
  closeTestPlan,
  reopenTestPlan,
  useTestPlanQuery,
  useTestPlanTesterProgressQuery,
  changeTestPlanEnvironment,
} from "@/services/TestPlanService";
import { openReportInNewTab, saveReportFile } from "@/services/ReportService";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MetricCard } from "@/components/ui/metric-card";
import { toaster } from "@/components/ui/toaster";
import { ErrorState, LoadingState } from "@/components/ui/page-states";
import { PageHeaderCard } from "@/components/ui/page-header-card";
import type { components } from "@/lib/api/v1";
import { formatHumanDateTime } from "@/lib/date-time";
import $api from "@/lib/api/query";
import { useTranslation } from "react-i18next";

type TestPlanData = components["schemas"]["schema.TestPlanResponseItem"];

// The close dialog names at most this many testers who have not finished, the rest
// are counted and the owner is sent to the Testers tab for the full breakdown
const MAX_LISTED_TESTERS = 5;

type NavItem = {
  label: string;
  path:
    | "/projects/$projectId/test-plans/$testPlanID"
    | "/projects/$projectId/test-plans/$testPlanID/execute"
    | "/projects/$projectId/test-plans/$testPlanID/test-cases"
    | "/projects/$projectId/test-plans/$testPlanID/test-runs"
    | "/projects/$projectId/test-plans/$testPlanID/testers"
    | "/projects/$projectId/test-plans/$testPlanID/comments";
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

  // Used to warn, before closing, about assigned test cases that are not done yet
  const { data: progressData } = useTestPlanTesterProgressQuery(testPlanID);
  const testerProgress = progressData?.testers ?? [];
  const notTestedOf = (p: (typeof testerProgress)[number]) =>
    (p.assigned_count ?? 0) - (p.tested_count ?? 0);
  // Furthest behind first, so the names shown are the ones worth following up
  const behindTesters = testerProgress
    .filter((p) => notTestedOf(p) > 0)
    .sort((a, b) => notTestedOf(b) - notTestedOf(a));
  const listedBehindTesters = behindTesters.slice(0, MAX_LISTED_TESTERS);
  const unlistedTesterCount = behindTesters.length - listedBehindTesters.length;
  const notTestedCount = behindTesters.reduce(
    (total, p) => total + (p.assigned_count ?? 0) - (p.tested_count ?? 0),
    0
  );
  const awaitingReviewCount = testerProgress.reduce(
    (total, p) => total + (p.awaiting_review_count ?? 0),
    0
  );

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
    { label: t("test_plans.nav.comments"), path: "/projects/$projectId/test-plans/$testPlanID/comments" },
  ];

  if (isLoading) return <LoadingState label={t("test_plans.loading")} />;
  if (error || !testPlan) return <ErrorState title={t("test_plans.error")} />;

  const handleMarkComplete = async () => {
    if (!testPlan.id) return;
    try {
      setIsClosing(true);
      const result = await closeTestPlan(testPlan.id);
      await refetch();
      if (result?.report) {
        toaster.success({ title: t("test_plans.close.success") });
      } else {
        // The plan is closed, only its report failed
        toaster.warning({ title: t("test_plans.close.report_failed"), duration: 8000 });
      }
    } catch (closeError: any) {
      console.error("Failed to close test plan:", closeError);
      // The message says which test runs stop the plan from closing, so leave it up long enough to read
      toaster.error({
        title: t("test_plans.close.error"),
        description: closeError?.message,
        duration: 10000,
      });
    } finally {
      setIsClosing(false);
    }
  };

  const handleReopen = async () => {
    if (!testPlan.id) return;
    try {
      await reopenTestPlan(testPlan.id);
      await refetch();
      toaster.success({ title: t("test_plans.reopen.success") });
    } catch (reopenError: any) {
      toaster.error({ title: t("test_plans.reopen.error"), description: reopenError?.message });
    }
  };

  const reportId = testPlan.report_id;
  const handleReportAction = async (action: "view" | "download") => {
    if (!reportId) return;
    try {
      if (action === "view") {
        await openReportInNewTab(projectId, reportId);
      } else {
        await saveReportFile(projectId, reportId);
      }
    } catch (reportError) {
      console.error("Failed to open report:", reportError);
      toaster.error({ title: t("test_plans.report.error") });
    }
  };
  const isLocked = Boolean(testPlan.is_locked);

  const kindLabel = testPlan.kind
    ? t(`test_cases.kind.${testPlan.kind}`)
    : t("test_plans.not_available");

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
            {!reportId && (
              <Badge colorPalette="gray" variant="subtle">
                {t("test_plans.report.none")}
              </Badge>
            )}
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
            {reportId && (
              <>
                <Button colorPalette="blue" variant="outline" onClick={() => handleReportAction("view")}>
                  <IconFileText />
                  {t("test_plans.report.view")}
                </Button>
                <Button colorPalette="blue" variant="ghost" onClick={() => handleReportAction("download")}>
                  <IconDownload />
                  {t("test_plans.report.download")}
                </Button>
              </>
            )}
            {testPlan.is_complete || isLocked ? (
              <ConfirmDialog
                title={t("test_plans.reopen.confirm_title")}
                description={t("test_plans.reopen.confirm_description")}
                confirmLabel={t("test_plans.reopen")}
                cancelLabel={t("test_plans.cancel")}
                confirmColorPalette="orange"
                onConfirm={handleReopen}
                trigger={
                  <Button colorPalette="orange" variant="outline">
                    <IconLockOpen />
                    {t("test_plans.reopen")}
                  </Button>
                }
              />
            ) : (
              <ConfirmDialog
                title={t("test_plans.close.confirm_title")}
                description={t("test_plans.close.confirm_description")}
                confirmLabel={
                  notTestedCount > 0
                    ? t("test_plans.close.confirm_anyway")
                    : t("test_plans.close.confirm")
                }
                cancelLabel={t("test_plans.cancel")}
                confirmColorPalette={notTestedCount > 0 ? "orange" : "green"}
                onConfirm={handleMarkComplete}
                trigger={
                  <Button colorPalette="green" loading={isClosing} disabled={isClosing}>
                    {t("test_plans.close.mark_complete")}
                  </Button>
                }
              >
                {(closeDialog) => (notTestedCount > 0 || awaitingReviewCount > 0) && (
                  <Alert.Root status="warning" mt={4} alignItems="flex-start">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Title>{t("test_plans.close.outstanding_title")}</Alert.Title>
                      <Alert.Description>
                        <Stack gap={2} mt={1}>
                          {notTestedCount > 0 && (
                            <Box>
                              <Text fontWeight="semibold">
                                {t("test_plans.close.not_tested", {
                                  count: notTestedCount,
                                  testers: behindTesters.length,
                                })}
                              </Text>
                              <Box as="ul" ps={5} listStyleType="disc">
                                {listedBehindTesters.map((p) => (
                                  <li key={p.tester_id}>
                                    {t("test_plans.close.tester_not_tested", {
                                      name: p.tester_name || `User ${p.tester_id}`,
                                      count: notTestedOf(p),
                                      total: p.assigned_count ?? 0,
                                    })}
                                  </li>
                                ))}
                              </Box>
                              {unlistedTesterCount > 0 && (
                                <Text mt={1}>
                                  {t("test_plans.close.more_testers", { count: unlistedTesterCount })}{" "}
                                  <Link
                                    to="/projects/$projectId/test-plans/$testPlanID/testers"
                                    params={{ projectId, testPlanID }}
                                    hash="testers"
                                    onClick={closeDialog}
                                    style={{ textDecoration: "underline", fontWeight: 600 }}
                                  >
                                    {t("test_plans.close.open_testers")}
                                  </Link>
                                </Text>
                              )}
                            </Box>
                          )}
                          {awaitingReviewCount > 0 && (
                            <Text>
                              {t("test_plans.close.awaiting_review", { count: awaitingReviewCount })}{" "}
                              <Link
                                to="/projects/$projectId/test-plans/$testPlanID/test-runs"
                                params={{ projectId, testPlanID }}
                                search={{ review: "awaiting" }}
                                onClick={closeDialog}
                                style={{ textDecoration: "underline", fontWeight: 600 }}
                              >
                                {t("test_plans.close.review_runs")}
                              </Link>
                            </Text>
                          )}
                        </Stack>
                      </Alert.Description>
                    </Alert.Content>
                  </Alert.Root>
                )}
              </ConfirmDialog>
            )}
          </HStack>
        }
      />

      {isLocked && (
        <Alert.Root status="info" mb={6}>
          <Alert.Indicator>
            <IconLock />
          </Alert.Indicator>
          <Alert.Content>
            <Alert.Description>{t("test_plans.locked_notice")}</Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}

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
              disabled={isLocked}
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