import { closeTestRun, getTestRunsByPlan } from "@/services/TestRunService";
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  HStack,
  Input,
  InputGroup,
  Separator,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { IconSearch, IconX } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/page-states";
import { toaster } from "@/components/ui/toaster";
import type { components } from "@/lib/api/v1";
import { formatHumanDateTime } from "@/lib/date-time";

type TestRunItem = components["schemas"]["schema.TestRunResponse"];
type ResultFilter = "all" | "passed" | "failed" | "pending";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-plans/$testPlanID/test-runs/"
)({
  component: TestPlanTestRunsPage,
});

function TestPlanTestRunsPage() {
  const { testPlanID } = Route.useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [closingRunId, setClosingRunId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["testRuns", testPlanID],
    queryFn: () => getTestRunsByPlan(testPlanID),
  });

  const allRuns = useMemo(() => {
    const runs = data?.test_runs;
    return Array.isArray(runs) ? (runs as TestRunItem[]) : [];
  }, [data?.test_runs]);

  const filteredRuns = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return allRuns.filter((run) => {
      const runState = getResultState(run.result_state);
      const matchesFilter = resultFilter === "all" || runState === resultFilter;

      if (!matchesFilter) return false;
      if (!term) return true;

      const searchable = [
        run.id,
        run.code,
        run.test_case_title,
        run.executed_by,
        run.result_state,
        run.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(term);
    });
  }, [allRuns, resultFilter, searchTerm]);

  const closedRuns = allRuns.filter((run) => run.is_closed).length;
  const openRuns = allRuns.length - closedRuns;
  const passedRuns = allRuns.filter((run) => getResultState(run.result_state) === "passed").length;
  const failedRuns = allRuns.filter((run) => getResultState(run.result_state) === "failed").length;

  if (isLoading) return <LoadingState label="Loading test runs..." />;
  if (error) return <ErrorState title="Error loading test runs" />;

  const handleClose = async (runId: string) => {
    try {
      setClosingRunId(runId);
      await closeTestRun(runId);
      toaster.success({ title: "Test run closed" });
      await refetch();
    } catch (closeError) {
      console.error("Failed to close test run", closeError);
      toaster.error({ title: "Failed to close test run" });
    } finally {
      setClosingRunId(null);
    }
  };

  return (
    <Box w="full">
      <Card.Root border="sm" borderColor="border.subtle" bg="bg.surface" mb={5}>
        <Card.Body p={{ base: 4, md: 6 }}>
          <Stack gap={2}>
            <Heading size="lg" color="fg.heading">
              Test Runs
            </Heading>
            <Text color="fg.subtle">
              Review execution output, compare expected vs actual results, and
              close runs after verification.
            </Text>
            <HStack gap={2} flexWrap="wrap">
              <Badge colorPalette="brand" variant="subtle">
                {allRuns.length} total
              </Badge>
              <Badge colorPalette="green" variant="subtle">
                {passedRuns} passed
              </Badge>
              <Badge colorPalette="red" variant="subtle">
                {failedRuns} failed
              </Badge>
              <Badge colorPalette="orange" variant="subtle">
                {openRuns} open
              </Badge>
              <Badge colorPalette="gray" variant="subtle">
                {closedRuns} closed
              </Badge>
            </HStack>
          </Stack>
        </Card.Body>
      </Card.Root>

      <Card.Root border="sm" borderColor="border.subtle" bg="bg.surface" mb={5}>
        <Card.Body p={4}>
          <Stack gap={3}>
            <InputGroup startElement={<IconSearch size={16} />}>
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by title, code, notes, result, or executor"
              />
            </InputGroup>
            <HStack gap={2} flexWrap="wrap">
              {(["all", "passed", "failed", "pending"] as ResultFilter[]).map(
                (value) => (
                  <Button
                    key={value}
                    size="xs"
                    variant={resultFilter === value ? "solid" : "outline"}
                    colorPalette={resultFilter === value ? "brand" : "gray"}
                    onClick={() => setResultFilter(value)}
                  >
                    {value === "all"
                      ? "All"
                      : value.charAt(0).toUpperCase() + value.slice(1)}
                  </Button>
                )
              )}
            </HStack>
          </Stack>
        </Card.Body>
      </Card.Root>

      {allRuns.length === 0 ? (
        <EmptyState
          title="No test runs found"
          description="Execute this test plan to start generating runs."
        />
      ) : filteredRuns.length === 0 ? (
        <EmptyState
          title="No matching test runs"
          description="Adjust the filters or search term to see run activity."
        />
      ) : (
        <Stack gap={4}>
          {filteredRuns.map((run, index) => {
            const runStatus = getResultState(run.result_state);
            const runLabel = run.test_case_title?.trim() || `Test Run ${index + 1}`;
            const runId = run.id ?? "";

            return (
              <Card.Root
                key={run.id ?? `${runLabel}-${index}`}
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
                          {runLabel}
                        </Heading>
                        {run.code && (
                          <Text fontSize="sm" color="fg.subtle">
                            Code: {run.code}
                          </Text>
                        )}
                      </Stack>
                      <HStack gap={2} flexWrap="wrap">
                        <Badge
                          colorPalette={getResultColor(runStatus)}
                          variant="subtle"
                        >
                          {runStatus.toUpperCase()}
                        </Badge>
                        <Badge
                          colorPalette={run.is_closed ? "gray" : "orange"}
                          variant="subtle"
                        >
                          {run.is_closed ? "Closed" : "Open"}
                        </Badge>
                        {runId && (
                          <Badge colorPalette="blue" variant="outline">
                            ID: {runId}
                          </Badge>
                        )}
                      </HStack>
                    </Flex>

                    <Grid
                      templateColumns={{
                        base: "1fr",
                        md: "repeat(2, minmax(0, 1fr))",
                      }}
                      gap={4}
                    >
                      <DetailItem label="Executed By" value={run.executed_by} />
                      <DetailItem
                        label="Tested On"
                        value={formatHumanDateTime(run.tested_on, {
                          fallback: "Not recorded",
                        })}
                      />
                      <DetailItem label="Expected Result" value={run.expected_result} />
                      <DetailItem label="Actual Result" value={run.actual_result} />
                    </Grid>

                    <Separator />

                    <Stack gap={2}>
                      <Text fontSize="xs" color="fg.subtle">
                        Notes
                      </Text>
                      <Text color="fg.default">{run.notes?.trim() || "No notes added."}</Text>
                    </Stack>

                    {!run.is_closed && runId && (
                      <Button
                        alignSelf="start"
                        size="sm"
                        variant="outline"
                        colorPalette="red"
                        loading={closingRunId === runId}
                        onClick={() => handleClose(runId)}
                      >
                        <IconX />
                        Close Test Run
                      </Button>
                    )}
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

function getResultState(resultState?: string): ResultFilter {
  const normalized = (resultState ?? "").toLowerCase();
  if (normalized.includes("pass")) return "passed";
  if (normalized.includes("fail")) return "failed";
  if (normalized.includes("pending")) return "pending";
  return "pending";
}

function getResultColor(state: ResultFilter) {
  switch (state) {
    case "passed":
      return "green";
    case "failed":
      return "red";
    default:
      return "orange";
  }
}

function DetailItem({ label, value }: { label: string; value?: string }) {
  return (
    <Stack gap={1}>
      <Text fontSize="xs" color="fg.subtle">
        {label}
      </Text>
      <Text color="fg.default">{value?.trim() || "N/A"}</Text>
    </Stack>
  );
}
