import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  HStack,
  Progress,
  Spinner,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import {
  IconAlertTriangle,
  IconCalendarDue,
  IconCircleCheck,
  IconClipboardList,
  IconPlayerPause,
  IconX,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MetricCard } from "@/components/ui/metric-card";
import { useProjectInsightsQuery } from "@/services/InsightsService";
import {
  coverageByModule,
  formatPercent,
  healthSummary,
  neverExecutedCases,
  planComparison,
  resultsOverTime,
  type PlanStatus,
  type RangeDays,
} from "@/lib/insights";

export const Route = createFileRoute("/(project)/projects/$projectId/insights/")({
  component: InsightsPage,
});

const RANGES: RangeDays[] = [7, 30, 90];
const NEVER_RUN_LIST_LIMIT = 10;

const STATUS_PALETTE: Record<PlanStatus, string> = {
  overdue: "red",
  active: "blue",
  complete: "green",
};

function InsightsPage() {
  const { projectId } = Route.useParams();
  const { t, i18n } = useTranslation();
  const [rangeDays, setRangeDays] = useState<RangeDays>(30);
  const [showAllNeverRun, setShowAllNeverRun] = useState(false);
  const { data, isLoading, error } = useProjectInsightsQuery(projectId);

  const project = data?.project;

  const computed = useMemo(() => {
    if (!project) return null;
    const { testCases, testPlans, testRuns } = project;
    return {
      health: healthSummary(testCases, testPlans, testRuns, rangeDays),
      trend: resultsOverTime(testRuns, rangeDays, Date.now(), i18n.language),
      plans: planComparison(testPlans),
      modules: coverageByModule(testCases, testRuns),
      neverRun: neverExecutedCases(testCases, testRuns),
      drafts: testCases.filter((c) => c.isDraft).length,
    };
  }, [project, rangeDays, i18n.language]);

  if (isLoading) return <Spinner size="xl" color="brand.solid" />;
  if (error) return <Text color="fg.error">{t("insights.error")}</Text>;
  if (!project || !computed) return <Text>{t("insights.not_found")}</Text>;

  const { health, trend, plans, modules, neverRun, drafts } = computed;
  const hasRunsInPeriod = trend.some((b) => b.passed + b.failed + b.blocked > 0);

  const change = health.passRateChange;
  const passRateTrend =
    change === null
      ? undefined
      : {
          value: t("insights.health.pass_rate_change", {
            value: `${change >= 0 ? "+" : ""}${Math.round(change)}`,
          }),
          direction: (change > 0 ? "up" : change < 0 ? "down" : "flat") as "up" | "down" | "flat",
        };

  return (
    <Box p={6} w="full">
      <Flex justify="space-between" align={{ base: "start", md: "center" }} direction={{ base: "column", md: "row" }} gap={4} mb={6}>
        <Stack gap={1}>
          <Heading size="2xl" color="fg.heading">{t("insights.title")}</Heading>
        </Stack>
        <HStack gap={2} role="group" aria-label={t("insights.range.label")}>
          {RANGES.map((days) => (
            <Button
              key={days}
              size="sm"
              variant={days === rangeDays ? "solid" : "outline"}
              colorPalette="brand"
              onClick={() => setRangeDays(days)}
              aria-pressed={days === rangeDays}
            >
              {t("insights.range.days", { count: days })}
            </Button>
          ))}
        </HStack>
      </Flex>

      {/* 1. Health at a glance */}
      <Grid templateColumns="repeat(auto-fit, minmax(var(--chakra-sizes-56), 1fr))" gap={4} mb={8}>
        <MetricCard
          label={t("insights.health.pass_rate")}
          value={formatPercent(health.passRate)}
          icon={IconCircleCheck}
          tone={health.passRate === null ? "neutral" : health.passRate >= 0.8 ? "success" : "warning"}
          variant="emphasis"
          trend={passRateTrend}
          helperText={t("insights.health.pass_rate_helper", { count: health.executedInPeriod, days: rangeDays })}
        />
        <MetricCard
          label={t("insights.health.failing")}
          value={health.failing}
          icon={IconX}
          tone={health.failing > 0 ? "danger" : "neutral"}
          helperText={t("insights.health.failing_helper")}
        />
        <MetricCard
          label={t("insights.health.blocked")}
          value={health.blocked}
          icon={IconPlayerPause}
          tone={health.blocked > 0 ? "warning" : "neutral"}
          helperText={t("insights.health.blocked_helper")}
        />
        <MetricCard
          label={t("insights.health.never_executed")}
          value={health.neverExecuted}
          icon={IconClipboardList}
          tone={health.neverExecuted > 0 ? "info" : "neutral"}
          helperText={t("insights.health.never_executed_helper")}
        />
        <MetricCard
          label={t("insights.health.active_plans")}
          value={health.activePlans}
          icon={health.overduePlans > 0 ? IconAlertTriangle : IconCalendarDue}
          tone={health.overduePlans > 0 ? "danger" : "brand"}
          helperText={t("insights.health.overdue_helper", { count: health.overduePlans })}
        />
      </Grid>

      {/* 2. Results over time */}
      <Section title={t("insights.trend.title")}>
        {hasRunsInPeriod ? (
          <Box h="300px">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="passed" name={t("insights.state.passed")} stackId="r" fill="var(--chakra-colors-green-500)" />
                <Bar dataKey="failed" name={t("insights.state.failed")} stackId="r" fill="var(--chakra-colors-red-500)" />
                <Bar dataKey="blocked" name={t("insights.state.blocked")} stackId="r" fill="var(--chakra-colors-orange-400)" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <EmptyText>{t("insights.trend.empty", { days: rangeDays })}</EmptyText>
        )}
      </Section>

      {/* 4. Test plan comparison */}
      <Section title={t("insights.plans.title")}>
        {plans.length === 0 ? (
          <EmptyText>{t("insights.plans.empty")}</EmptyText>
        ) : (
          <Box overflowX="auto">
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>{t("insights.plans.plan")}</Table.ColumnHeader>
                  <Table.ColumnHeader>{t("insights.plans.status")}</Table.ColumnHeader>
                  <Table.ColumnHeader minW="40">{t("insights.plans.progress")}</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">{t("insights.plans.pass_rate")}</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">{t("insights.plans.results")}</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {plans.map(({ plan, status, progress, passRate }) => (
                  <Table.Row key={plan.id}>
                    <Table.Cell>
                      <Link
                        to="/projects/$projectId/test-plans/$testPlanID"
                        params={{ projectId, testPlanID: plan.id }}
                      >
                        <Text color="brand.fg" fontWeight="medium" _hover={{ textDecoration: "underline" }}>
                          {plan.description || t("insights.plans.untitled", { id: plan.id })}
                        </Text>
                      </Link>
                      <Text fontSize="xs" color="fg.muted">{plan.kind}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge colorPalette={STATUS_PALETTE[status]} variant="subtle">
                        {t(`insights.plans.status_${status}`)}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <HStack gap={2}>
                        <Progress.Root value={Math.round(progress * 100)} size="sm" flex="1" colorPalette="brand">
                          <Progress.Track>
                            <Progress.Range />
                          </Progress.Track>
                        </Progress.Root>
                        <Text fontSize="xs" color="fg.muted" minW="9" textAlign="end">
                          {formatPercent(progress)}
                        </Text>
                      </HStack>
                    </Table.Cell>
                    <Table.Cell textAlign="end">{formatPercent(passRate)}</Table.Cell>
                    <Table.Cell textAlign="end">
                      <Text fontSize="xs" whiteSpace="nowrap">
                        <Text as="span" color="green.600">{plan.passedCount}</Text>
                        {" / "}
                        <Text as="span" color="red.600">{plan.failedCount}</Text>
                        {" / "}
                        <Text as="span" color="fg.muted">{plan.pendingCount}</Text>
                      </Text>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
            <Text fontSize="xs" color="fg.muted" mt={2}>{t("insights.plans.results_legend")}</Text>
          </Box>
        )}
      </Section>

      {/* 5. Coverage gaps */}
      <Section title={t("insights.coverage.title")}>
        {modules.length === 0 ? (
          <EmptyText>{t("insights.coverage.empty")}</EmptyText>
        ) : (
          <Stack gap={6}>
            <Box overflowX="auto">
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>{t("insights.coverage.module")}</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="end">{t("insights.coverage.test_cases")}</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="end">{t("insights.coverage.executed_runs")}</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="end">{t("insights.coverage.never_executed")}</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="end">{t("insights.coverage.pass_rate")}</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {modules.map((m) => (
                    <Table.Row key={m.module ?? "__none__"}>
                      <Table.Cell>
                        {m.module ?? <Text as="span" color="fg.muted">{t("insights.coverage.no_module")}</Text>}
                      </Table.Cell>
                      <Table.Cell textAlign="end">{m.testCases}</Table.Cell>
                      <Table.Cell textAlign="end">{m.executedRuns}</Table.Cell>
                      <Table.Cell textAlign="end" color={m.neverExecuted > 0 ? "orange.600" : undefined}>
                        {m.neverExecuted}
                      </Table.Cell>
                      <Table.Cell textAlign="end">{formatPercent(m.passRate)}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>

            <Box>
              <HStack justify="space-between" mb={2} flexWrap="wrap">
                <Heading size="sm" color="fg.heading">
                  {t("insights.coverage.never_run_title", { count: neverRun.length })}
                </Heading>
                {drafts > 0 && (
                  <Badge variant="subtle" colorPalette="gray">
                    {t("insights.coverage.drafts", { count: drafts })}
                  </Badge>
                )}
              </HStack>
              {neverRun.length === 0 ? (
                <EmptyText>{t("insights.coverage.never_run_empty")}</EmptyText>
              ) : (
                <Stack gap={1}>
                  {(showAllNeverRun ? neverRun : neverRun.slice(0, NEVER_RUN_LIST_LIMIT)).map((c) => (
                    <Link
                      key={c.id}
                      to="/projects/$projectId/test-cases/$testCaseId"
                      params={{ projectId, testCaseId: c.id }}
                    >
                      <Text fontSize="sm" _hover={{ textDecoration: "underline" }}>
                        <Text as="span" fontFamily="mono" color="fg.muted" mr={2}>{c.code}</Text>
                        {c.title}
                      </Text>
                    </Link>
                  ))}
                  {neverRun.length > NEVER_RUN_LIST_LIMIT && (
                    <Button
                      variant="plain"
                      size="sm"
                      alignSelf="start"
                      px={0}
                      color="brand.fg"
                      _hover={{ textDecoration: "underline" }}
                      aria-expanded={showAllNeverRun}
                      onClick={() => setShowAllNeverRun((v) => !v)}
                    >
                      {showAllNeverRun
                        ? t("insights.coverage.show_less")
                        : t("insights.coverage.and_more", { count: neverRun.length - NEVER_RUN_LIST_LIMIT })}
                    </Button>
                  )}
                </Stack>
              )}
            </Box>
          </Stack>
        )}
      </Section>
    </Box>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card.Root border="sm" borderColor="border.subtle" shadow="sm" mb={8}>
      <Card.Header>
        <Heading size="lg" color="fg.heading">{title}</Heading>
      </Card.Header>
      <Card.Body>{children}</Card.Body>
    </Card.Root>
  );
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return <Text color="fg.muted" fontSize="sm">{children}</Text>;
}
