import { createFileRoute, Link } from "@tanstack/react-router";
import { useTestPlanQuery } from "@/services/TestPlanService";
import { Box, Heading, Text, Stack, Badge, Button, Flex } from "@chakra-ui/react";
import { Outlet } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-plans/$testPlanID"
)({
  component: ViewTestPlan,
});

function ViewTestPlan() {
  const { projectId, testPlanID } = Route.useParams();

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

  const navItems = [
    { label: "Test Cases", path: `/projects/$projectId/test-plans/$testPlanID/test-cases` },
    { label: "Test Runs", path: `/projects/$projectId/test-plans/$testPlanID/test-runs` },
    { label: "Testers", path: `/projects/$projectId/test-plans/$testPlanID/testers` },
  ];

  if (isLoading) return <div>Loading...</div>;
  if (error)
    return <div>Error loading test plan or test runs</div>;

  return (
    <Box p={6}>
      <Heading mb={4}>Test Plan Details</Heading>
      <Flex
        gap="2"
        borderBottom="1px solid"
        borderColor="gray.200"
        bg="gray.50"
        overflowX="auto"
      >
        {navItems.map((item) => {
          const isActive = false;
          // TODO: const isActive = matchRoute({item.path.replace("$projectId", projectId));
          return (
            <Link
              key={item.label}
              to={item.path}
              params={{ projectId, testPlanID }}
            >
              <Button
                variant={isActive ? "solid" : "ghost"}
                colorScheme="teal"
                size="sm"
              >
                {item.label}
              </Button>
            </Link>
          );
        })}
      </Flex>

      
      <Flex dir="column">
      <Stack gap={3} flexGrow={2}>
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
        </Stack>
        <Stack gap={3}>
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
      </Flex>
      <hr />
      <Outlet />
    </Box>
  );
}
