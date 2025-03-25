import { createFileRoute } from "@tanstack/react-router";
import { Box, Heading } from "@chakra-ui/react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { findTestPlansAllQueryOptions } from "@/data/queries/test-plans";

export const Route = createFileRoute("/(app)/test-plans/")({
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
    return "Loading Test Plans...";
  }

  if (error) {
    return <div className="error">Error: error fetching</div>;
  }
  const testPlanList = testPlans.map((t) => <p>{t.description}</p>);
  return (
    <Box>
      <Heading>List Test Plans</Heading>

      {testPlanList}
    </Box>
  );
}
