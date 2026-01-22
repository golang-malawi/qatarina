import { createFileRoute } from "@tanstack/react-router";
import { Alert, Box, Button, Flex, Heading, VStack} from "@chakra-ui/react";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {toaster} from "@/components/ui/toaster"
import $api from "@/lib/api/query";

export const Route = createFileRoute("/(app)/projects/")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData($api.queryOptions("get", "/v1/projects")),
  component: ProjectsPage,
});

function ProjectsPage() {
  const queryClient = useQueryClient();

  const {
    data: { projects },
    isPending,
    error,
  } = useSuspenseQuery($api.queryOptions("get", "/v1/projects"));

  const deleteMutation = $api.useMutation("delete", "/v1/projects/{projectID}");

  if (isPending) {
    return "Loading Projects...";
  }

  if (error) {
    return <div className="error">Error: error fetching</div>;
  }

  const handleDelete = (projectID: number, title: string) => {
    if (confirm(`Are you sure you want to delete project "${title}"?`)){
      deleteMutation.mutate(
        {params: {path: {projectID: projectID.toString()}}},
        {
          onSuccess: () => {
            toaster.create({
              title: "Success",
              description: `Project "${title}" deleted successfully`,
              type: "success",
            });
            queryClient.invalidateQueries({queryKey: ["projects"]});
          },
          onError: (error: any) => {
            toaster.create({
              title: "Error",
              description: error?.message ?? "Failed to delete project",
              type: "error",
            });
          },
        }
      );
    }
  };

  const projectList = (projects ?? []).map((record) => (
    <Box key={record.id} width={"100%"} p="4">
      <Heading size="2xl">{record.title}</Heading>
      {record.website_url && (
        <p>
          URL: <a href={record.website_url}>{record.website_url}</a>
        </p>
      )}
      <Flex gap="2">
        <Link
          to={`/projects/$projectId`}
          params={{
            projectId: (record.id ?? "").toString(),
          }}
        >
          <Button variant={"outline"} colorScheme="black" size={"sm"}>
            Manage
          </Button>
        </Link>
        <Link
          to={`/projects/$projectId/test-cases/new`}
          params={{
            projectId: (record.id ?? "").toString(),
          }}
        >
          <Button variant={"outline"} colorScheme="blue" size={"sm"}>
            Add Test Cases
          </Button>
        </Link>
        <Link
          to={`/projects/$projectId/test-plans/new`}
          params={{
            projectId: (record.id ?? "").toString(),
          }}
        >
          <Button variant={"outline"} colorScheme="blue" size={"sm"}>
            New Test Plan
          </Button>
        </Link>
        <Button
         variant="outline" 
         colorScheme="red"
         size={"sm"}
          loading={deleteMutation.isPending}
          onClick={() => handleDelete(record.id!, record.title!)}
        >
          <IconTrash />
        </Button>
      </Flex>
    </Box>
  ));

  return (
    <Box>
      <Box paddingBottom={"2"} borderBottom={"1px solid #efefef"}>
        <Heading size="3xl">Projects</Heading>
        <Alert.Root m="2" variant="outline">
          <Alert.Content>Manage Projects on QATARINA here.</Alert.Content>
        </Alert.Root>
        <Link to="/projects/new">
          <Button>
            <IconPlus /> Create Project
          </Button>
        </Link>
      </Box>
      <VStack width={"100%"}>{projectList}</VStack>
    </Box>
  );
}
