import { Box, Button, Container, Flex, Heading } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import TestPlanService from "../../services/TestPlanService";
import ProjectService from "../../services/ProjectService";
import { Link } from "react-router-dom";
import { IconRefreshDot, IconTrash } from "@tabler/icons-react";

export default function ListProjectTestPlans() {
  const { projectId } = useParams();
  const [testPlans, setTestPlans] = useState([]);
  const testPlanService = new TestPlanService();
  // const projectService = new ProjectService();
  useEffect(() => {
    testPlanService
      .findAllByProject(projectId!)
      .then((data) => setTestPlans(data));
  }, [projectId]);

  const testPlanList = testPlans.map((entry) => (
    <Flex alignItems={"start"} gap="3" p="5">
      <Link to={`/projects/${projectId}/test-plans/${entry?.id}/execute`}>
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
