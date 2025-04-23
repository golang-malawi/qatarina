import { createFileRoute } from "@tanstack/react-router";
import { Box, Button, Flex, Heading, VStack } from "@chakra-ui/react";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { allProjectsQueryOptions } from "@/data/queries/projects";

export const Route = createFileRoute("/(app)/projects/")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(allProjectsQueryOptions),
  component: ProjectsPage,
});

function ProjectsPage() {
  const {
    data: projects,
    isPending,
    error,
  } = useSuspenseQuery(allProjectsQueryOptions);

  if (isPending) {
    return "Loading Projects...";
  }

  if (error) {
    return <div className="error">Error: error fetching</div>;
  }

  const projectList = projects.map((record) => (
    <Box key={record.id} width={"100%"} p="4">
      <Heading size="2xl">{record.title}</Heading>
      <p>
        URL: <a href={record.project_url}>{record.project_url}</a>
      </p>
      <Flex gap="2">
        <Link
          to={`/projects/$projectId`}
          params={{
            projectId: record.id,
          }}
        >
          <Button variant={"outline"} colorScheme="black" size={"sm"}>
            Manage
          </Button>
        </Link>
        <Link
          to={`/projects/$projectId/test-cases/new`}
          params={{
            projectId: record.id,
          }}
        >
          <Button variant={"outline"} colorScheme="blue" size={"sm"}>
            Add Test Cases
          </Button>
        </Link>
        <Link
          to={`/projects/$projectId/test-plans/new`}
          params={{
            projectId: record.id,
          }}
        >
          <Button variant={"outline"} colorScheme="blue" size={"sm"}>
            New Test Plan
          </Button>
        </Link>
        <Button variant={"outline"} colorScheme="red" size={"sm"}>
          <IconTrash />
        </Button>
      </Flex>
    </Box>
  ));

  return (
    <Box>
      <Box paddingBottom={"2"} borderBottom={"1px solid #efefef"}>
        <Heading>Projects</Heading>
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
