import { createFileRoute, Link } from "@tanstack/react-router";
import { Button, Container, Flex, Heading } from "@chakra-ui/react";
import { useDeleteTestPlanMutation } from "@/services/TestPlanService";
import { IconRefreshDot, IconTrash } from "@tabler/icons-react";
import {toaster} from "@/components/ui/toaster";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { findProjectTestPlansQueryOptions } from "@/data/queries/test-plans";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-plans/"
)({
  loader: ({ context: { queryClient }, params: { projectId } }) =>
    queryClient.ensureQueryData(findProjectTestPlansQueryOptions(projectId)),
  component: ListProjectTestPlans,
});

function ListProjectTestPlans() {
  const { projectId } = Route.useParams();
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteTestPlanMutation();
 
  const testPlansQueryOptions = findProjectTestPlansQueryOptions(projectId);
  const { data: testPlans } = useSuspenseQuery(testPlansQueryOptions);

  const handleDelete = async (testPlanID: string) => {
    if (!window.confirm("Are you sure you want to delete this test plan?")) return;

    try {
      await deleteMutation.mutateAsync({
        params: { path: { testPlanID } },
      });
      toaster.create({
        title: "Test plan deleted successfully",
        type: "success",
      });
      queryClient.invalidateQueries({ queryKey: testPlansQueryOptions.queryKey });
    }catch (err) {
      console.error("Failed to delete test plan", err);
      toaster.create({
        title: "Failed to delete test plan",
        type: "error",
      });
    }
  };
  
  const testPlanList = (testPlans?.test_plans ?? []).map((entry) => {
    return(
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
    );
         
});
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
