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
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { toaster } from "@/components/ui/toaster";
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

type TestPlanItem = components["schemas"]["schema.TestPlanResponseItem"];

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-plans/"
)({
  component: ListProjectTestPlans,
});

function ListProjectTestPlans() {
  const { projectId } = Route.useParams();
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
    [testPlans?.test_plans]
  );
  const filteredPlans = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return plans;
    return plans.filter((plan) => {
      const searchable = [
        plan.id?.toString(),
        plan.description,
        plan.kind,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchable.includes(term);
    });
  }, [plans, searchTerm]);
  const completedCount = plans.filter((plan) => plan.is_complete).length;
  const activeCount = plans.length - completedCount;

  if (isLoading) return <LoadingState label="Loading test plans..." />;
  if (error) return <ErrorState title="Error loading test plans" />;

  const handleDelete = async (testPlanID: string) => {
    await deleteMutation.mutateAsync({
      params: { path: { testPlanID } },
    });
    toaster.success({ title: "Test plan deleted successfully" });
    await refetch();
  };

  return (
    <Box w="full">
      <PageHeaderCard
        title="Test Plans"
        description="Track progress, execute runs, and manage plan lifecycle for this project."
        badges={
          <>
            <Badge colorPalette="brand" variant="subtle">
              {plans.length} total
            </Badge>
            <Badge colorPalette="green" variant="subtle">
              {completedCount} completed
            </Badge>
            <Badge colorPalette="orange" variant="subtle">
              {activeCount} active
            </Badge>
          </>
        }
        actions={
          <Link
            to="/projects/$projectId/test-plans/new"
            params={{ projectId: `${projectId}` }}
          >
            <Button colorPalette="brand">
              <IconPlus />
              New Test Plan
            </Button>
          </Link>
        }
      />

      <PageToolbarCard>
        <InputGroup startElement={<IconSearch size={16} />}>
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by ID, description, or kind"
          />
        </InputGroup>
      </PageToolbarCard>

      {filteredPlans.length === 0 ? (
        <EmptyState
          title="No test plans found"
          description="Create a plan or adjust the search filter."
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
                          Start:{" "}
                          {formatHumanDate(entry.start_at, {
                            fallback: "Not scheduled",
                          })}{" "}
                          | End:{" "}
                          {formatHumanDate(entry.scheduled_end_at, {
                            fallback: "Not scheduled",
                          })}
                        </Text>
                      </Stack>
                      <HStack gap={2} flexWrap="wrap">
                        <Badge
                          colorPalette={entry.is_complete ? "green" : "orange"}
                          variant="subtle"
                        >
                          {entry.is_complete ? "Completed" : "In Progress"}
                        </Badge>
                        <Badge
                          colorPalette={entry.is_locked ? "red" : "gray"}
                          variant="subtle"
                        >
                          <Icon as={IconLock} />
                          {entry.is_locked ? "Locked" : "Open"}
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
                        label="Total Cases"
                        value={total}
                        icon={IconListCheck}
                        tone="brand"
                        variant="emphasis"
                        helperText="Cases in this plan"
                      />
                      <MetricCard
                        label="Passed"
                        value={passed}
                        icon={IconCheck}
                        tone="success"
                        variant="subtle"
                        helperText="Validated outcomes"
                      />
                      <MetricCard
                        label="Failed"
                        value={failed}
                        icon={IconX}
                        tone="danger"
                        variant="subtle"
                        helperText="Needs triage"
                      />
                      <MetricCard
                        label="Pending"
                        value={pending}
                        icon={IconClock}
                        tone="warning"
                        variant="subtle"
                        helperText="Awaiting execution"
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
                            Start Session
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          variant="outline"
                          colorPalette="green"
                          size="sm"
                          disabled
                        >
                          <IconPlayerPlay />
                          Start Session
                        </Button>
                      )}

                      {hasId ? (
                        <Link
                          to="/projects/$projectId/test-plans/$testPlanID"
                          params={{ projectId, testPlanID }}
                        >
                          <Button variant="outline" colorPalette="brand" size="sm">
                            <IconListCheck />
                            View Plan
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          variant="outline"
                          colorPalette="brand"
                          size="sm"
                          disabled
                        >
                          <IconListCheck />
                          View Plan
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
                            Delete
                          </Button>
                        }
                        title="Delete test plan?"
                        description="This action cannot be undone."
                        confirmLabel="Delete"
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
