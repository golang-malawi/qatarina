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
  Icon,
  Input,
  InputGroup,
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
  IconPlus,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MetricCard } from "@/components/ui/metric-card";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/page-states";
import { PageHeaderCard } from "@/components/ui/page-header-card";
import { PageToolbarCard } from "@/components/ui/page-toolbar-card";
import {
  useDeleteTestPlanMutation,
  useProjectTestPlansQuery,
} from "@/services/TestPlanService";
import type { components } from "@/lib/api/v1";
import { formatHumanDate } from "@/lib/date-time";
import { useMemo, useState } from "react";
import { IconTrash } from "@tabler/icons-react";
import { toaster } from "@/components/ui/toaster";
import { findProjectTestPlansQueryOptions } from "@/data/queries/test-plans";
import { useTranslation } from "react-i18next";

type TestPlanItem = components["schemas"]["schema.TestPlanResponseItem"];

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-plans/",
)({
  loader: ({ context: { queryClient }, params: { projectId } }) =>
    queryClient.ensureQueryData(findProjectTestPlansQueryOptions(projectId)),
  component: ListProjectTestPlans,
});

function ListProjectTestPlans() {
  const { projectId } = Route.useParams();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const deleteMutation = useDeleteTestPlanMutation();
  const {
    data: testPlans,
    isLoading,
    error,
    refetch,
  } = useProjectTestPlansQuery(projectId!);
  const plans = useMemo(
    () => (testPlans?.test_plans ?? []) as TestPlanItem[],
    [testPlans?.test_plans],
  );
  const filteredPlans = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return plans;
    return plans.filter((plan) => {
      const searchable = [plan.id?.toString(), plan.description, plan.kind]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchable.includes(term);
    });
  }, [plans, searchTerm]);
  const completedCount = plans.filter((plan) => plan.is_complete).length;
  const activeCount = plans.length - completedCount;

  if (isLoading) return <LoadingState label={t("test_plans.loading")} />;
  if (error) return <ErrorState title={t("test_plans.error")} />;

  const handleDelete = async (testPlanID: string) => {
  try {
    await deleteMutation.mutateAsync({
      params: { path: { testPlanID } },
    });

    toaster.success({ title: t("test_plans.delete.success") });
    await refetch();
  } catch (err: any) {
    toaster.error({
      title: t("test_plans.delete.error"),
      description: err?.message,
    });
  }
};

  return (
    <Box w="full">
      <PageHeaderCard
        title={t("test_plans")}
        description={t("test_plans.header_description")}
        badges={
          <>
            <Badge colorPalette="brand" variant="subtle">
              {plans.length} {t("test_plans.total")}
            </Badge>
            <Badge colorPalette="green" variant="subtle">
              {completedCount} {t("test_plans.completed")}
            </Badge>
            <Badge colorPalette="orange" variant="subtle">
              {activeCount} {t("test_plans.active")}
            </Badge>
          </>
        }
        actions={
          <Link to="/projects/$projectId/test-plans/new" params={{ projectId: `${projectId}` }}>
            <Button colorPalette="brand">
              <IconPlus />
              {t("test_plans.create_new")}
            </Button>
          </Link>
        }
      />

      <PageToolbarCard>
        <InputGroup startElement={<IconSearch size={16} />}>
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={t("test_plans.search_placeholder")}
          />
        </InputGroup>
      </PageToolbarCard>

      {filteredPlans.length === 0 ? (
        <EmptyState
          title={t("test_plans.empty")}
          description={t("test_plans.empty_description")}
        />
      ) : (
        <Stack gap={4}>
          {filteredPlans.map((entry, index) => {
            const testPlanID = entry.id ? String(entry.id) : "";
            const hasId = Boolean(entry.id);
            const title =
              entry.description?.trim() ||
              `Test Plan #${entry.id ?? index + 1}`;
            const passed = entry.passed_count ?? 0;
            const failed = entry.failed_count ?? 0;
            const pending = entry.pending_count ?? 0;
            const total = entry.num_test_cases ?? passed + failed + pending;

            return (
              <Card.Root
                key={entry.id ?? `${title}-${index}`}
                border="sm"
                borderColor="border.subtle"
                bg="bg.surface"
                shadow="sm"
              >
                <Card.Body p={5}>
                  <Stack gap={4}>
                    <Flex
                      direction={{ base: "column", md: "row" }}
                      justify="space-between"
                      align={{ base: "start", md: "center" }}
                      gap={3}
                    >
                      <Stack gap={1}>
                        <Heading size="md" color="fg.heading">
                          {title}
                        </Heading>
                        <Text fontSize="sm" color="fg.subtle">
                          {t("test_plans.start")}:{" "}
                          {formatHumanDate(entry.start_at, { fallback: t("test_plans.not_scheduled") })}{" "}
                          | {t("test_plans.end")}:{" "}
                          {formatHumanDate(entry.scheduled_end_at, { fallback: t("test_plans.not_scheduled") })}
                        </Text>
                      </Stack>
                      <HStack gap={2} flexWrap="wrap">
                        <Badge
                          colorPalette={entry.is_complete ? "green" : "orange"}
                          variant="subtle"
                        >
                          {entry.is_complete
                            ? t("test_plans.status.completed")
                            : t("test_plans.status.in_progress")}
                        </Badge>
                        <Badge
                          colorPalette={entry.is_locked ? "red" : "gray"}
                          variant="subtle"
                        >
                          <Icon as={IconLock} />
                          {entry.is_locked
                            ? t("test_plans.status.locked")
                            : t("test_plans.status.open")}
                        </Badge>
                        {entry.kind && (
                          <Badge colorPalette="blue" variant="subtle">
                            {entry.kind}
                          </Badge>
                        )}
                      </HStack>
                    </Flex>

                    <Grid
                      templateColumns={{
                        base: "repeat(2, minmax(0, 1fr))",
                        md: "repeat(4, minmax(0, 1fr))",
                      }}
                      gap={3}
                    >
                      <MetricCard
                        label={t("test_plans.metric.total")}
                        value={total}
                        icon={IconListCheck}
                        tone="brand"
                        variant="emphasis"
                        helperText={t("test_plans.metric.total_helper")}
                      />
                      <MetricCard
                        label={t("test_plans.metric.passed")}
                        value={passed}
                        icon={IconCheck}
                        tone="success"
                        variant="subtle"
                        helperText={t("test_plans.metric.passed_helper")}
                      />
                      <MetricCard
                        label={t("test_plans.metric.failed")}
                        value={failed}
                        icon={IconX}
                        tone="danger"
                        variant="subtle"
                        helperText={t("test_plans.metric.failed_helper")}
                      />
                      <MetricCard
                        label={t("test_plans.metric.pending")}
                        value={pending}
                        icon={IconClock}
                        tone="warning"
                        variant="subtle"
                        helperText={t("test_plans.metric.pending_helper")}
                      />
                    </Grid>

                    <Separator />

                    <Flex wrap="wrap" gap={2}>
                      {hasId ? (
                        <Link
                          to="/projects/$projectId/test-plans/$testPlanID/execute"
                          params={{ projectId, testPlanID }}
                        >
                          <Button variant="outline" colorPalette="green" size="sm">
                            <IconPlayerPlay />
                            {t("test_plans.start_session")}
                          </Button>
                        </Link>
                      ) : (
                        <Button variant="outline" colorPalette="green" size="sm" disabled>
                          <IconPlayerPlay />
                          {t("test_plans.start_session")}
                        </Button>
                      )}

                      {hasId ? (
                        <Link
                          to="/projects/$projectId/test-plans/$testPlanID"
                          params={{ projectId, testPlanID }}
                        >
                          <Button variant="outline" colorPalette="brand" size="sm">
                            <IconListCheck />
                            {t("test_plans.view_plan")}
                          </Button>
                        </Link>
                      ) : (
                        <Button variant="outline" colorPalette="brand" size="sm" disabled>
                          <IconListCheck />
                          {t("test_plans.view_plan")}
                        </Button>
                      )}

                      <ConfirmDialog
                        trigger={
                          <Button
                            variant="outline"
                            colorPalette="danger"
                            size="sm"
                            loading={deleteMutation.isPending}
                            disabled={!hasId}
                          >
                            <IconTrash />
                            {t("test_plans.delete")}
                          </Button>
                        }
                        title={t("test_plans.delete_confirm_title")}
                        description={t("test_plans.delete_confirm_description")}
                        confirmLabel={t("test_plans.delete")}
                        onConfirm={() => handleDelete(testPlanID)}
                      />
                    </Flex>
                  </Stack>
                </Card.Body>
              </Card.Root>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
