import { getTestRuns } from '@/services/TestPlanService';
import { Box, Heading, Stack, Text } from '@chakra-ui/react'
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
    data: testRuns,
    isLoading: isLoading,
    error: error,
  } = useQuery({
    queryKey: ["testRuns", testPlanID],
    queryFn: () => getTestRuns(testPlanID!),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error)
    return <div>Error loading test runs</div>;

  return (
    <div>
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
    </div>
  )
}
