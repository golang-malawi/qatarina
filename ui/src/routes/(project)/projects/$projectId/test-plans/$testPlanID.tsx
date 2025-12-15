import { createFileRoute, Link } from "@tanstack/react-router";
import { useTestPlanQuery } from "@/services/TestPlanService";
import {
  Box,
  Heading,
  Text,
  Stack,
  Badge,
  Button,
  Flex,
} from "@chakra-ui/react";
import { FormatNumber, Progress, Stat } from "@chakra-ui/react";
import { Outlet } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-plans/$testPlanID"
)({
  component: ViewTestPlan,
});

// 2. Define the TestPlan type for cleaner type assertion
type TestPlanData = {
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

function ViewTestPlan() {
  const { projectId, testPlanID } = Route.useParams();

  // Fetch test plan
  const {
    data: initialTestPlan,
    isLoading,
    error,
  } = useTestPlanQuery(testPlanID!) as unknown as {
    data: TestPlanData; // Use the defined type
    isLoading: boolean;
    error: unknown;
  };

  // 3. Use the useState hook to manage the local state of the test plan
  const [testPlan, setTestPlan] = useState(initialTestPlan);

  // 4. Implement mock action functions
  const handleMarkComplete = () => {
    if (testPlan) {
      setTestPlan({
        ...testPlan,
        IsComplete: { Bool: true },
        UpdatedAt: { Time: new Date().toISOString() }, // Optionally update timestamp
      });
    }
  };

  const handleMarkInProgress = () => {
    if (testPlan) {
      setTestPlan({
        ...testPlan,
        IsComplete: { Bool: false },
        UpdatedAt: { Time: new Date().toISOString() },
      });
    }
  };

  const navItems = [
    {
      label: "Test Cases",
      path: `/projects/$projectId/test-plans/$testPlanID/test-cases`,
    },
    {
      label: "Test Runs",
      path: `/projects/$projectId/test-plans/$testPlanID/test-runs`,
    },
    {
      label: "Testers",
      path: `/projects/$projectId/test-plans/$testPlanID/testers`,
    },
  ];

  // 5. Use the local 'testPlan' state in the loading check
  if (isLoading) return <div>Loading...</div>;
  // If the initial data fetch is successful, initialTestPlan is not null, so 'testPlan' will be set.
  if (error || !testPlan)
    return <div>Error loading test plan or test runs</div>;

  // Define status constants for clarity
  const isComplete = testPlan.IsComplete.Bool;
  const statusColorScheme = isComplete ? "green" : "orange";
  const statusText = isComplete ? "Complete" : "In Progress";

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
            <strong>ID:</strong> {testPlan.ID}
          </Text>
          <Text>
            <strong>Kind:</strong> {testPlan.Kind}
          </Text>
          <Text>
            <strong>Description:</strong>{" "}
            {testPlan.Description.Valid ? testPlan.Description.String : "—"}
          </Text>
          {/* 6. Display Status and Mock Action Buttons in a Flex container */}
          <Flex align="center" gap={3}>
            <Text>
              <strong>Status:</strong>{" "}
              <Badge colorScheme={statusColorScheme}>{statusText}</Badge>
            </Text>
            {/* 7. Action Buttons */}
            {isComplete ? (
              <Button
                onClick={handleMarkInProgress}
                size="xs"
                colorScheme="orange"
                variant="outline"
              >
                Mark as In Progress
              </Button>
            ) : (
              <Button
                onClick={handleMarkComplete}
                size="xs"
                colorScheme="green"
              >
                Mark as Complete
              </Button>
            )}
          </Flex>

          <Flex gap="10" wrap="wrap">
            <Stat.Root maxW="240px">
              <Stat.Label>Total Test Cases</Stat.Label>
              <Stat.ValueText>
                {testPlan.NumTestCases}
              </Stat.ValueText>
            </Stat.Root>

            <Stat.Root maxW="240px">
              <Stat.Label>Passed Test Cases</Stat.Label>
              <Stat.ValueText>98</Stat.ValueText>
             
            </Stat.Root>

            <Stat.Root maxW="240px">
              <Stat.Label>Failed Test Cases</Stat.Label>
              <Stat.ValueText>
                 {testPlan.NumFailures}
              </Stat.ValueText>
            </Stat.Root>

            <Stat.Root maxW="240px">
              <Stat.Label>Testers Assigned</Stat.Label>
              <Stat.ValueText>5</Stat.ValueText>
             
            </Stat.Root>
          </Flex>
        </Stack>
        <Stack gap={3}>
          {/* <Text>
            <strong>Assigned To:</strong> {testPlan.AssignedToID}
          </Text>
          <Text>
            <strong>Created By:</strong> {testPlan.CreatedByID}
          </Text> */}
          <Text>
            <strong>Start Date:</strong>{" "}
            {testPlan.StartAt.Valid
              ? new Date(testPlan.StartAt.Time).toLocaleString()
              : "—"}
          </Text>
          <Text>
            <strong>Scheduled End:</strong>{" "}
            {testPlan.ScheduledEndAt.Valid
              ? new Date(testPlan.ScheduledEndAt.Time).toLocaleString()
              : "—"}
          </Text>
          {/* <Text>
            <strong>Failures:</strong> {testPlan.NumFailures}
          </Text> */}
          <Text>
            <strong>Locked:</strong> {testPlan.IsLocked.Bool ? "Yes" : "No"}
          </Text>
          <Text>
            <strong>Has Report:</strong>{" "}
            {testPlan.HasReport.Bool ? "Yes" : "No"}
          </Text>
          {/* <Text>
            <strong>Created At:</strong>{" "}
            {new Date(testPlan.CreatedAt.Time).toLocaleString()}
          </Text>
          <Text>
            <strong>Updated At:</strong>{" "}
            {new Date(testPlan.UpdatedAt.Time).toLocaleString()}
          </Text> */}
        </Stack>
      </Flex>
      <hr />
      <Outlet />
    </Box>
  );
}
