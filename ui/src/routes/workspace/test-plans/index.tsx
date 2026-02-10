import { createFileRoute } from "@tanstack/react-router";
import { Box, Flex, Heading, Spinner, Stack, Text } from "@chakra-ui/react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { findTestPlansAllQueryOptions } from "@/data/queries/test-plans";

export const Route = createFileRoute("/workspace/test-plans/")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(findTestPlansAllQueryOptions),
  component: ListTestPlans,
});

function ListTestPlans() {
  const {
    data: testPlans,
    isPending,
    error,
  } = useSuspenseQuery(findTestPlansAllQueryOptions);

  if (isPending) {
    return (
      <Flex justify="center" align="center" minH="40">
        <Spinner size="xl" color="brand.solid" />
      </Flex>
    );
  }

  if (error) {
    return <Text color="fg.error">Error: error fetching</Text>;
  }
  const testPlanList = (testPlans?.data?.test_plans ?? []).map((t: any, i: number) => (
    <Box
      key={i}
      p={4}
      border="sm"
      borderColor="border.subtle"
      borderRadius="lg"
      bg="bg.surface"
      shadow="sm"
    >
      <Text color="fg.muted">{t.description}</Text>
    </Box>
  ));
  return (
    <Box p={6}>
      <Heading color="fg.heading">List Test Plans</Heading>
      <Stack mt={4} gap={3}>
        {testPlanList}
      </Stack>
    </Box>
  );
}
