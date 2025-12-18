import { getTestCasesByTestPlanID } from '@/services/TestCaseService';
import { Badge, Box, Flex, Heading, Input, Stack, Text } from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/(project)/projects/$projectId/test-plans/$testPlanID/test-cases/',
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { testPlanID } = Route.useParams();
  const {
    data: testCases,
    isLoading: isLoading,
    error: error,
  } = useQuery({
    queryKey: ["testCases", testPlanID],
    queryFn: () => getTestCasesByTestPlanID(testPlanID),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error)
    return <div>Error loading test runs</div>;
  const displayData = Array.isArray(testCases) ? testCases : testCases?.data || [];

return (
  <div>
    <Heading>Tests In this Plan</Heading>
    <Input
      name="searchTestCase"
      placeholder="Search for test cases..." 
    />

    {displayData.length > 0 ? (
      <Stack gap={2} mt={3}>
        {displayData.map((run: any) => (
          <Box key={run.id} p={3} borderWidth="1px" rounded="md">
            <Flex gap={1}>
              <Badge><strong>Code:</strong> {run.code}</Badge>
              <Badge><strong>Module:</strong> {run.feature_or_module}</Badge>
              {run.tags?.map((tag: string) => (
                <Badge key={`${run.id}-${tag}`} bgColor={'teal.200'}>{tag}</Badge>
              ))}
            </Flex>
            <Text>
              <strong>Title:</strong> {run.title || "—"}
            </Text>
          </Box>
        ))}
      </Stack>
    ) : (
      <Text mt={2}>No test found.</Text>
    )}
  </div>
);
}