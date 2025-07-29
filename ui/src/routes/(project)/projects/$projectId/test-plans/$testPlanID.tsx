import { createFileRoute } from "@tanstack/react-router";
import { useTestPlanQuery } from "@/services/TestPlanService";
import { Box, Heading, Text,Stack,Badge } from "@chakra-ui/react";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-plans/$testPlanID"
)({
  component: ViewTestPlan,
});
  
function ViewTestPlan() {
  const { testPlanID } = Route.useParams();

  const { data: testPlan, isLoading, error } = useTestPlanQuery(testPlanID!) as unknown as {
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

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading test plan</div>;

  return (
    <Box p={6}>
      <Heading mb={4}>Test Plan Details</Heading>
      <Stack gap={3}>
        <Text><strong>ID:</strong> {testPlan?.ID}</Text>
        <Text><strong>Kind:</strong> {testPlan?.Kind}</Text>
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
        <Text><strong>Assigned To:</strong> {testPlan?.AssignedToID}</Text>
        <Text><strong>Created By:</strong> {testPlan?.CreatedByID}</Text>
        <Text><strong>Start Date:</strong> {testPlan?.StartAt?.Valid ? new Date(testPlan.StartAt.Time).toLocaleString() : "—"}</Text>
        <Text><strong>Scheduled End:</strong> {testPlan?.ScheduledEndAt?.Valid ? new Date(testPlan.ScheduledEndAt.Time).toLocaleString() : "—"}</Text>
        <Text><strong>Failures:</strong> {testPlan?.NumFailures}</Text>
        <Text><strong>Locked:</strong> {testPlan?.IsLocked?.Bool ? "Yes" : "No"}</Text>
        <Text><strong>Has Report:</strong> {testPlan?.HasReport?.Bool ? "Yes" : "No"}</Text>
        <Text><strong>Created At:</strong> {testPlan ? new Date(testPlan.CreatedAt.Time).toLocaleString() : "—"}</Text>
        <Text><strong>Updated At:</strong> {testPlan ? new Date(testPlan.UpdatedAt.Time).toLocaleString() : "—"}</Text>
      </Stack>
    </Box>
  );
}