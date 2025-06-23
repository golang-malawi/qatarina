import { createFileRoute, Link } from "@tanstack/react-router";
import { Button, Container, Flex, Heading } from "@chakra-ui/react";
import { useProjectTestPlansQuery } from "@/services/TestPlanService";
import { IconRefreshDot, IconTrash } from "@tabler/icons-react";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-plans/"
)({
  component: ListProjectTestPlans,
});

function ListProjectTestPlans() {
  const { projectId } = Route.useParams();
  const {
    data: testPlans,
    isLoading,
    error,
  } = useProjectTestPlansQuery(projectId!);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading test plans</div>;

  const testPlanList = (testPlans?.test_plans ?? []).map((entry) => (
    <Flex alignItems={"start"} gap="3" p="5" key={entry?.id}>
      <Link
        to={`/projects/$projectId/test-plans/$testPlanID/execute`}
        params={{
          projectId: projectId,
          testPlanID: entry?.id?.toString() ?? "",
        }}
      >
        {entry?.description}
      </Link>
      <Button variant={"outline"} colorScheme="orange" size="sm">
        <IconRefreshDot color="black" />
        &nbsp;Start a Test Session
      </Button>
      <Button variant={"outline"} colorScheme="black" size="sm">
        <IconTrash color="red" />
        &nbsp;Delete
      </Button>
    </Flex>
  ));
  return (
    <Container>
      <Heading>Test Plans</Heading>
      {testPlanList}
    </Container>
  );
}
