import { Box, Heading } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import TestPlanService from "../../services/TestPlanService";
import { TestPlan } from "../../common/models";

export default function ListTestPlans() {
  const testPlanService = new TestPlanService();
  const {
    data: testPlans,
    isPending,
    error,
  } = useQuery<TestPlan[]>({
    queryFn: () => testPlanService.findAll().then((data) => data),
    queryKey: ["test-plans"],
  });

  if (isPending) {
    return "Loading Test Plans...";
  }

  if (error) {
    return <div className="error">Error: error fetching</div>;
  }
  const testPlanList = testPlans.map((t) => <p>{t.Description.String}</p>);
  return (
    <Box>
      <Heading>List Test Plans</Heading>

      {testPlanList}
    </Box>
  );
}
