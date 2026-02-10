import { createFileRoute, Link } from "@tanstack/react-router";
import { Button, Container, Flex, Heading, Spinner, Text } from "@chakra-ui/react";
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

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="40">
        <Spinner size="xl" color="brand.solid" />
      </Flex>
    );
  }
  if (error) return <Text color="fg.error">Error loading test plans</Text>;

  const testPlanList = (testPlans?.test_plans ?? []).map((entry) => (
    <Flex
      alignItems={"start"}
      gap="3"
      p="5"
      key={entry?.id}
      bg="bg.surface"
      border="sm"
      borderColor="border.subtle"
      borderRadius="lg"
      shadow="sm"
    >
      <Link
        to={`/projects/$projectId/test-plans/$testPlanID/execute`}
        params={{
          projectId: projectId,
          testPlanID: entry?.id?.toString() ?? "",
        }}
      >
        {entry?.description}
      </Link>

      <Link
        to={`/projects/$projectId/test-plans/$testPlanID`}
        
        params={{
          projectId,
          testPlanID: entry?.id?.toString() ?? "",
        }}
      >
        <Button variant={"outline"} size={"sm"} colorPalette="brand">
          View Test Plan
        </Button>
      </Link>

      <Button variant={"outline"} colorPalette="warning" size="sm">
        <IconRefreshDot />
        &nbsp;Start a Test Session
      </Button>

      <Button variant={"outline"} colorPalette="danger" size="sm">
        <IconTrash />
        &nbsp;Delete
      </Button>
    </Flex>
  ));
  return (
    <Container>
      <Heading color="fg.heading">Test Plans</Heading>
      <Link
        to={`/projects/$projectId/test-plans/new`}
        params={{
          projectId: `${projectId}`,
        }}
      >
        <Button variant={"outline"} colorPalette="brand" size={"sm"}>
          New Test Plan
        </Button>
      </Link>
      {testPlanList}
    </Container>
  );
}
