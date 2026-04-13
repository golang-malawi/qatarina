import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  HStack,
  Icon,
  Stack,
  Text,
} from "@chakra-ui/react";
import { IconListCheck, IconPlayerPlay, IconReport } from "@tabler/icons-react";
import TestCaseGrid from "@/components/TestCaseGrid";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-plans/$testPlanID/execute/"
)({
  component: ExecuteTestPlan,
});

function ExecuteTestPlan() {
  const { projectId, testPlanID } = Route.useParams();

  return (
    <Box w="full">
      <Card.Root border="sm" borderColor="border.subtle" bg="bg.surface" mb={6}>
        <Card.Body p={{ base: 5, md: 6 }}>
          <Flex
            direction={{ base: "column", lg: "row" }}
            justify="space-between"
            align={{ base: "start", lg: "center" }}
            gap={4}
          >
            <Stack gap={2} maxW="3xl">
              <HStack gap={2}>
                <Icon as={IconPlayerPlay} color="brand.solid" />
                <Heading size="lg" color="fg.heading">
                  Execute Test Plan
                </Heading>
              </HStack>
              <Text color="fg.subtle">
                Run through test cases, capture outcomes, and keep execution
                updates in sync for reporting.
              </Text>
            </Stack>

            <HStack gap={2} flexWrap="wrap">
              <Link
                to="/projects/$projectId/test-plans/$testPlanID/test-cases"
                params={{ projectId, testPlanID }}
              >
                <Button variant="outline" size="sm">
                  <IconListCheck />
                  View Test Cases
                </Button>
              </Link>
              <Link
                to="/projects/$projectId/test-plans/$testPlanID/test-runs"
                params={{ projectId, testPlanID }}
              >
                <Button variant="outline" size="sm">
                  <IconReport />
                  View Test Runs
                </Button>
              </Link>
            </HStack>
          </Flex>
        </Card.Body>
      </Card.Root>

      <Card.Root border="sm" borderColor="border.subtle" bg="bg.surface">
        <Card.Body p={{ base: 4, md: 5 }}>
          <Box overflowX="auto" minH="80">
            <TestCaseGrid />
          </Box>
        </Card.Body>
      </Card.Root>
    </Box>
  );
}
