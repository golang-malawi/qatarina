import { createFileRoute } from "@tanstack/react-router";
import { useTestPlanQuery, getTestRuns } from "@/services/TestPlanService";
import { Box, Heading, Text, Stack, Badge } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-plans/$testPlanID"
)({
  component: ViewTestPlan,
});

function ViewTestPlan() {
  const { testPlanID } = Route.useParams();

  // Fetch test plan
  const {
    data: testPlan,
    isLoading,
    error,
  } = useTestPlanQuery(testPlanID!) as unknown as {
    data: {
      ID: string;
      Kind: string;
      Description: { Valid: boolean; String: string };
      IsComplete: { Bool: boolean };
      AssignedToID: string;
      CreatedByID: string;
      StartAt: { Valid: boolean; Time: string };
      ScheduledEndAt: { Valid: boolean; Time: string };
      NumFailures: number;
      IsLocked: { Bool: boolean };
      HasReport: { Bool: boolean };
      CreatedAt: { Time: string };
      UpdatedAt: { Time: string };
    } | null;
    isLoading: boolean;
    error: unknown;
  };

  // Fetch test runs (v5 object form)
  const {
    data: testRuns,
    isLoading: runsLoading,
    error: runsError,
  } = useQuery({
    queryKey: ["testRuns", testPlanID],
    queryFn: () => getTestRuns(testPlanID!),
  });

  if (isLoading || runsLoading) return <div>Loading...</div>;
  if (error || runsError)
    return <div>Error loading test plan or test runs</div>;

  return (
    <Box p={6}>
      <Heading mb={4}>Test Plan Details</Heading>
      <Stack gap={3}>
        <Text>
          <strong>ID:</strong> {testPlan?.ID}
        </Text>
        <Text>
          <strong>Kind:</strong> {testPlan?.Kind}
        </Text>
        <Text>
          <strong>Description:</strong>{" "}
          {testPlan?.Description?.Valid ? testPlan.Description.String : "—"}
        </Text>
        <Text>
          <strong>Status:</strong>{" "}
          <Badge colorScheme={testPlan?.IsComplete?.Bool ? "green" : "orange"}>
            {testPlan?.IsComplete?.Bool ? "Complete" : "In Progress"}
          </Badge>
        </Text>
        <Text>
          <strong>Assigned To:</strong> {testPlan?.AssignedToID}
        </Text>
        <Text>
          <strong>Created By:</strong> {testPlan?.CreatedByID}
        </Text>
        <Text>
          <strong>Start Date:</strong>{" "}
          {testPlan?.StartAt?.Valid
            ? new Date(testPlan.StartAt.Time).toLocaleString()
            : "—"}
        </Text>
        <Text>
          <strong>Scheduled End:</strong>{" "}
          {testPlan?.ScheduledEndAt?.Valid
            ? new Date(testPlan.ScheduledEndAt.Time).toLocaleString()
            : "—"}
        </Text>
        <Text>
          <strong>Failures:</strong> {testPlan?.NumFailures}
        </Text>
        <Text>
          <strong>Locked:</strong> {testPlan?.IsLocked?.Bool ? "Yes" : "No"}
        </Text>
        <Text>
          <strong>Has Report:</strong>{" "}
          {testPlan?.HasReport?.Bool ? "Yes" : "No"}
        </Text>
        <Text>
          <strong>Created At:</strong>{" "}
          {testPlan ? new Date(testPlan.CreatedAt.Time).toLocaleString() : "—"}
        </Text>
        <Text>
          <strong>Updated At:</strong>{" "}
          {testPlan ? new Date(testPlan.UpdatedAt.Time).toLocaleString() : "—"}
        </Text>
      </Stack>

      <Heading size="md" mt={6}>
        Test Runs
      </Heading>
      {(Array.isArray(testRuns) ? testRuns : testRuns?.data || []).length ? (
        <Stack gap={2} mt={3}>
          {(Array.isArray(testRuns) ? testRuns : testRuns?.data || []).map(
            (run: any) => (
              <Box key={run.ID} p={3} borderWidth="1px" rounded="md">
                <Text>
                  <strong>Code:</strong> {run.Code}
                </Text>
                <Text>
                  <strong>Status:</strong> {run.ResultState}
                </Text>
                <Text>
                  <strong>Expected:</strong>{" "}
                  {run.ExpectedResult?.Valid ? run.ExpectedResult.String : "—"}
                </Text>
                <Text>
                  <strong>Actual:</strong>{" "}
                  {run.ActualResult?.Valid ? run.ActualResult.String : "—"}
                </Text>
                <Text>
                  <strong>Notes:</strong> {run.Notes || "—"}
                </Text>
                <Text>
                  <strong>Tested On:</strong>{" "}
                  {new Date(run.TestedOn).toLocaleString()}
                </Text>
              </Box>
            )
          )}
        </Stack>
      ) : (
        <Text mt={2}>No test runs found.</Text>
      )}
    </Box>
  );
}
