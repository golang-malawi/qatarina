import { getTestRunsByPlan, closeTestRun } from '@/services/TestRunService';
import { Box, Button, Heading, Stack, Text, } from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/(project)/projects/$projectId/test-plans/$testPlanID/test-runs/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { testPlanID } = Route.useParams();
  // Fetch test runs (v5 object form)
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["testRuns", testPlanID],
    queryFn: () => getTestRunsByPlan(testPlanID!),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error)return <div>Error loading test runs</div>;

  const testRuns = data?.test_runs || [];

  const handleClose = async (runId: string) => {
    await closeTestRun(runId);
    refetch(); // Refetch test runs after closing
  };
  return (
    <div>
      <Heading size="md" mt={6}>
        Test Runs
      </Heading>
      {testRuns.length ? (
        <Stack gap={2} mt={3}>
          {testRuns.map((run: any) => (
            <Box key={run.id} p={3} borderWidth="1px" rounded="md">
              <Text>
                <strong>Test Case:</strong> {run.test_case_title}
              </Text>
              <Text>
                <strong>Code:</strong> {run.code}
              </Text>
              <Text>
                <strong>Status:</strong> {run.result_state}
              </Text>
              <Text>
                <strong>Expected:</strong> {run.expected_result || "N/A"}
              </Text>
              <Text>
                <strong>Actual:</strong> {run.actual_result || "N/A"}
              </Text>
              <Text>
                <strong>Notes:</strong> {run.notes || "None"}
              </Text>
              <Text>
                <strong>Tested On:</strong>{" "}
                {run.tested_on ? new Date(run.tested_on).toLocaleString() : "_"}
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
          ))}
        </Stack>
      ) : (
        <Text mt={2}>No test runs found.</Text>
      )}
    </div>
  );
}
