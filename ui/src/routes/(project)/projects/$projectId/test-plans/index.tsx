import { createFileRoute, Link } from "@tanstack/react-router";
import { Button, Container, Flex, Heading } from "@chakra-ui/react";
import { useProjectTestPlansQuery, useDeleteTestPlanMutation } from "@/services/TestPlanService";
import { IconRefreshDot, IconTrash } from "@tabler/icons-react";
import {toaster} from "@/components/ui/toaster";

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
    refetch,
  } = useProjectTestPlansQuery(projectId!);
  const deleteMutation = useDeleteTestPlanMutation();
 
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading test plans</div>;

  const handleDelete = async (testPlanID: string) => {
    if (!window.confirm("Are you sure you want to delete this test plan?")) return;

    try {
      await deleteMutation.mutateAsync({
        params: { path: { testPlanID } },
      });
      toaster.success({title: "Test plan deleted successfully"});
      refetch();  
    }catch (err) {
      console.error("Failed to delete test plan", err);
      toaster.error({title: "Failed to delete test plan"});
    }
  };
  
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

      <Link
        to={`/projects/$projectId/test-plans/$testPlanID`}
        
        params={{
          projectId,
          testPlanID: entry?.id?.toString() ?? "",
        }}
      >
        <Button variant={"outline"} size={"sm"}>View Test Plan</Button>
      </Link>

      <Button variant={"outline"} colorScheme="orange" size="sm">
        <IconRefreshDot color="black" />
        &nbsp;Start a Test Session
      </Button>

      <Button variant={"outline"} colorScheme="black" size="sm"
       onClick={() => handleDelete(entry?.id?.toString() ?? "")}
       >
        <IconTrash color="red" />
        &nbsp;Delete
      </Button>
    </Flex>
  ));
  return (
    <Container>
      <Heading>Test Plans</Heading>
      <Link
        to={`/projects/$projectId/test-plans/new`}
        params={{
          projectId: `${projectId}`,
        }}
      >
        <Button variant={"outline"} colorScheme="blue" size={"sm"}>
          New Test Plan
        </Button>
      </Link>
      {testPlanList}
    </Container>
  );
}
