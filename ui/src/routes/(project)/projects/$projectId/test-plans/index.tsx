import { createFileRoute, Link } from "@tanstack/react-router";
import { Button, Container, Flex, Heading } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import TestPlanService from "@/services/TestPlanService";
import { IconRefreshDot, IconTrash } from "@tabler/icons-react";
import { TestPlan } from "@/common/models";

export const Route = createFileRoute("/(project)/projects/$projectId/test-plans/")({
  component: ListProjectTestPlans,
});

function ListProjectTestPlans() {
  const { projectId } = Route.useParams();
  const [testPlans, setTestPlans] = useState<TestPlan[]>([]);
  const testPlanService = new TestPlanService();
  // const projectService = new ProjectService();
  useEffect(() => {
    testPlanService
      .findAllByProject(projectId!)
      .then((data) => setTestPlans(data));
  }, [projectId]);

  const testPlanList = testPlans.map((entry) => (
    <Flex alignItems={"start"} gap="3" p="5">
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
