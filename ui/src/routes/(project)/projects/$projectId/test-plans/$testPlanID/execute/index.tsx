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
import TestCaseGrid from "@/components/TestCaseGrid";
import { useExecuteTestCaseMutation } from "@/services/TestExecutionService";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-plans/$testPlanID/execute/"
)({
  component: ExecuteTestPlan,
});

function ExecuteTestPlan() {
  const { testPlanID } = Route.useParams();
  const mutation = useExecuteTestCaseMutation();

  const handleExecute = (testCaseID: string) => {
    mutation.mutate({
      testCaseID,
      testPlanID: Number(testPlanID),
      runner: "playwright", // or whichever runner you want
    });
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
            <TestCaseGrid
              onExecute={handleExecute}
              isExecuting={mutation.isPending}
            />
          </Box>
        </Card.Body>
      </Card.Root>

      {mutation.isError && (
        <Text color="red.500">Error: {(mutation.error as Error).message}</Text>
      )}
      {mutation.isSuccess && (
        <Text color="green.500">Run started! ID: {mutation.data.id}</Text>
      )}
    </Box>
  );
}
