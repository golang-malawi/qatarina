import { createFileRoute } from "@tanstack/react-router";
import {
  Alert,
  Box,
  Button,
  Flex,
  Heading,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
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

  const projectsQueryOptions = $api.queryOptions("get", "/v1/projects");

  const {
    data: { projects },
    isPending,
    error,
  } = useSuspenseQuery(projectsQueryOptions);

  const deleteMutation = $api.useMutation("delete", "/v1/projects/{projectID}");

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
            queryClient.setQueryData(projectsQueryOptions.queryKey, (oldData: any) => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                projects: oldData.projects.filter((p: any) => p.id !== projectID),
              };
            });
            queryClient.invalidateQueries({queryKey: projectsQueryOptions.queryKey});
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
    <Box
      key={record.id}
      width={"100%"}
      p="4"
      bg="bg.surface"
      border="sm"
      borderColor="border.subtle"
      borderRadius="lg"
      shadow="sm"
    >
      <Heading size="2xl" color="fg.heading">
        {record.title}
      </Heading>
      {record.website_url && (
        <Text color="fg.subtle">
          URL:{" "}
          <Box as="a" href={record.website_url} color="fg.accent">
            {record.website_url}
          </Box>
        </Text>
      )}
      <Flex gap="2">
        <Link
          to={`/projects/$projectId`}
          params={{
            projectId: (record.id ?? "").toString(),
          }}
        >
          <Button variant={"outline"} colorPalette="brand" size={"sm"}>
            Manage
          </Button>
        </Link>
        <Link
          to={`/projects/$projectId/test-cases/new`}
          params={{
            projectId: (record.id ?? "").toString(),
          }}
        >
          <Button variant={"outline"} colorPalette="info" size={"sm"}>
            Add Test Cases
          </Button>
        </Link>
        <Link
          to={`/projects/$projectId/test-plans/new`}
          params={{
            projectId: (record.id ?? "").toString(),
          }}
        >
          <Button variant={"outline"} colorPalette="info" size={"sm"}>
            New Test Plan
          </Button>
        </Link>
        <Button
         variant="outline" 
         colorPalette="danger"
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
      <Box
        paddingBottom={"2"}
        borderBottom={"sm"}
        borderColor="border.subtle"
        bg="bg.surface"
      >
        <Heading size="3xl" color="fg.heading">
          Projects
        </Heading>
        <Alert.Root m="2" variant="outline" colorPalette="info">
          <Alert.Content>Manage Projects on QATARINA here.</Alert.Content>
        </Alert.Root>
        <Link to="/projects/new">
          <Button colorPalette="brand">
            <IconPlus /> Create Project
          </Button>
        </Link>
      </Box>
      <VStack width={"100%"}>{projectList}</VStack>
    </Box>
  );
}
