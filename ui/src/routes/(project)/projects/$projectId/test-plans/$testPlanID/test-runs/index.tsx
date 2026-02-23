import { closeTestRun, getTestRunsByPlan } from "@/services/TestRunService";
import { Box, Button, Flex, Heading, Spinner, Stack, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-plans/$testPlanID/test-runs/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { testPlanID } = Route.useParams();
  // Fetch test runs (v5 object form)
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["testRuns", testPlanID],
    queryFn: () => getTestRunsByPlan(testPlanID!),
  });

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="40">
        <Spinner size="xl" color="brand.solid" />
      </Flex>
    );
  }
  if (error)
    return <Text color="fg.error">Error loading test runs</Text>;

  const testRuns = data?.test_runs || [];

  const handleClose = async (runId: string) => {
    await closeTestRun(runId);
    refetch(); // Refetch test runs after closing
  };
  return (
    <div>
      <Heading size="md" mt={6} color="fg.heading">
        Test Runs
      </Heading>
      {testRuns.length ? (
        <Stack gap={2} mt={3}>
          {(Array.isArray(testRuns) ? testRuns : testRuns || []).map(
            (run: any) => (
              <Box
                key={run.ID}
                p={3}
                border="sm"
                borderColor="border.subtle"
                rounded="lg"
                bg="bg.surface"
              >
                <Text>
                  <strong>Test Case:</strong> {run.test_case_title}
                </Text>
                <Text color="fg.muted">
                  <strong>Code:</strong> {run.Code}
                </Text>
                <Text color="fg.muted">
                  <strong>Status:</strong> {run.ResultState}
                </Text>
                <Text color="fg.muted">
                  <strong>Expected:</strong>{" "}
                  {run.ExpectedResult?.Valid ? run.ExpectedResult.String : "—"}
                </Text>
                <Text color="fg.muted">
                  <strong>Actual:</strong>{" "}
                  {run.ActualResult?.Valid ? run.ActualResult.String : "—"}
                </Text>
                <Text color="fg.muted">
                  <strong>Notes:</strong> {run.Notes || "—"}
                </Text>
                <Text color="fg.muted">
                  <strong>Tested On:</strong>{" "}
                  {new Date(run.TestedOn).toLocaleString()}
                </Text>
                <Text>
                  <strong>Executed By:</strong> {run.executed_by || "_"}
                </Text>
                <Text>
                  <strong>Closed:</strong> {run.is_closed ? "Yes" : "No"}
                </Text>
                {!run.is_closed && (
                  <Button size="sm" mt={2} onClick={() => handleClose(run.id)}>
                    Close Test Run
                  </Button>
                )}
              </Box>
            )
          )}
        </Stack>
      ) : (
        <Text mt={2} color="fg.muted">
          No test runs found.
        </Text>
      )}
    </div>
  );
}
