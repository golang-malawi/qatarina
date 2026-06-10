import { createFileRoute } from "@tanstack/react-router";
import {
  Box,
  Card,
  Flex,
  Heading,
  HStack,
  Icon,
  Stack,
  Text,
} from "@chakra-ui/react";
import { IconPlayerPlay } from "@tabler/icons-react";
import { useState } from "react";
import TestCaseGrid from "@/components/TestCaseGrid";
import { useExecuteTestCaseMutation } from "@/services/TestExecutionService";
import { useScriptTestCasesQuery } from "@/services/TestCaseService";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-plans/$testPlanID/execute/"
)({
  component: ExecuteTestPlan,
});

function ExecuteTestPlan() {
  const { testPlanID } = Route.useParams();
  const mutation = useExecuteTestCaseMutation();
  const [runStatus, setRunStatus] = useState<"started" | "passed" | "failed" | "pending" | null>(null);
  const [latestRunID, setLatestRunID] = useState<string | null>(null);

  // Fetch script-based test cases
  const { data, isLoading, isError } = useScriptTestCasesQuery(Number(testPlanID));

  const handleExecute = (testCaseID: string) => {
    setRunStatus("started");
    mutation.mutate(
      {
        testCaseID,
        testPlanID: Number(testPlanID),
        runner: "playwright", // or whichever runner you want
      },
      {
        onSuccess: (data) => {
          if (data?.id) {
            setLatestRunID(data.id);
          }
        },
      },
    );
  };

  const handleExecutionComplete = (state: "passed" | "failed" | "pending") => {
    setRunStatus(state);
  };

  return (
    <Box w="full">
      <Card.Root border="sm" borderColor="border.subtle" bg="bg.surface" mb={6}>
        <Card.Body p={{ base: 5, md: 6 }}>
          <Flex justify="space-between" align="center" gap={4}>
            <Stack gap={2}>
              <HStack gap={2}>
                <Icon as={IconPlayerPlay} color="brand.solid" />
                <Heading size="lg" color="fg.heading">
                  Execute Test Plan
                </Heading>
              </HStack>
              <Text color="fg.subtle">
                Select a test case below and run it against the configured runner.
              </Text>
            </Stack>
          </Flex>
        </Card.Body>
      </Card.Root>

      <Card.Root border="sm" borderColor="border.subtle" bg="bg.surface">
        <Card.Body p={{ base: 4, md: 5 }}>
          <Box overflowX="auto" minH="80">
            {isLoading && <Text>Loading script test cases...</Text>}
            {isError && <Text color="red.500">Failed to load test cases</Text>}
            {data && (
              <TestCaseGrid
                testCases={data.test_cases} // pass fetched cases
                onExecute={handleExecute}
                onExecutionComplete={handleExecutionComplete}
              />
            )}
          </Box>
        </Card.Body>
      </Card.Root>

      {mutation.isError && (
        <Text color="red.500">Error: {(mutation.error as Error).message}</Text>
      )}
      {mutation.isPending && runStatus === "started" && latestRunID && (
        <Text color="blue.500">Run started... ID: {latestRunID}</Text>
      )}
      {runStatus && runStatus !== "started" && (
        <Text color={runStatus === "passed" ? "green.500" : runStatus === "failed" ? "red.500" : "orange.500"}>
          Run finished: {runStatus}
        </Text>
      )}
    </Box>
  );
}
