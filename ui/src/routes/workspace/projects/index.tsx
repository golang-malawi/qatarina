import { createFileRoute } from "@tanstack/react-router";
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  Link as ChakraLink,
  Separator,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  IconFolder,
  IconLink,
  IconPlus,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toaster } from "@/components/ui/toaster";
import $api from "@/lib/api/query";
import { useMemo, useState } from "react";

type ProjectRecord = {
  id?: number;
  title?: string;
  description?: string;
  code?: string;
  version?: string;
  website_url?: string;
  github_url?: string;
  jira_url?: string;
  trello_url?: string;
  monday_url?: string;
  is_active?: boolean;
  updated_at?: string;
};

export const Route = createFileRoute("/workspace/projects/")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData($api.queryOptions("get", "/v1/projects")),
  component: ProjectsPage,
});

function ProjectsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const projectsQueryOptions = $api.queryOptions("get", "/v1/projects");

  const {
    data: { projects },
    isPending,
    error,
  } = useSuspenseQuery(projectsQueryOptions);

  const deleteMutation = $api.useMutation("delete", "/v1/projects/{projectID}");
  const projectRecords = useMemo(() => (projects ?? []) as ProjectRecord[], [projects]);
  const filteredProjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return projectRecords;
    return projectRecords.filter((record) => {
      const searchable = [
        record.title,
        record.description,
        record.code,
        record.version,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchable.includes(term);
    });
  }, [projectRecords, searchTerm]);
  const getIntegrationLabel = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

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
    if (confirm(`Are you sure you want to delete project "${title}"?`)) {
      deleteMutation.mutate(
        { params: { path: { projectID: projectID.toString() } } },
        {
          onSuccess: () => {
            toaster.create({
              title: "Success",
              description: `Project "${title}" deleted successfully`,
              type: "success",
            });
            queryClient.setQueryData(
              projectsQueryOptions.queryKey,
              (oldData: any) => {
                if (!oldData) return oldData;
                return {
                  ...oldData,
                  projects: oldData.projects.filter(
                    (p: any) => p.id !== projectID
                  ),
                };
              }
            );
            queryClient.invalidateQueries({
              queryKey: projectsQueryOptions.queryKey,
            });
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

  return (
    <Box w="full">
      <Card.Root
        border="sm"
        borderColor="border.subtle"
        bg="bg.surface"
        shadow="sm"
        mb={6}
      >
        <Card.Body p={{ base: 4, md: 6 }}>
          <Flex
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            align={{ base: "start", md: "center" }}
            gap={4}
          >
            <Stack gap={1}>
              <HStack gap={2}>
                <Icon as={IconFolder} color="brand.solid" />
                <Heading size="lg" color="fg.heading">
                  Project Workspace
                </Heading>
              </HStack>
              <Text color="fg.subtle">
                Manage active projects, jump into execution, and maintain test
                planning flow.
              </Text>
              <HStack gap={2}>
                <Badge colorPalette="brand" variant="subtle">
                  {filteredProjects.length} shown
                </Badge>
                <Badge colorPalette="gray" variant="subtle">
                  {projectRecords.length} total
                </Badge>
              </HStack>
            </Stack>
            <Link to="/workspace/projects/new">
              <Button colorPalette="brand">
                <IconPlus />
                Create Project
              </Button>
            </Link>
          </Flex>
        </Card.Body>
      </Card.Root>

      <Card.Root border="sm" borderColor="border.subtle" bg="bg.surface" mb={6}>
        <Card.Body p={{ base: 4, md: 5 }}>
          <InputGroup startElement={<IconSearch size={16} />}>
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by title, code, description, or version"
            />
          </InputGroup>
        </Card.Body>
      </Card.Root>

      {filteredProjects.length === 0 ? (
        <Card.Root border="sm" borderColor="border.subtle" bg="bg.surface">
          <Card.Body p={{ base: 8, md: 10 }}>
            <Stack align="center" gap={3} textAlign="center">
              <Heading size="md" color="fg.heading">
                No projects match your search
              </Heading>
              <Text color="fg.subtle" maxW="lg">
                Clear the search or create a new project to continue.
              </Text>
              <Link to="/workspace/projects/new">
                <Button colorPalette="brand">
                  <IconPlus />
                  New Project
                </Button>
              </Link>
            </Stack>
          </Card.Body>
        </Card.Root>
      ) : (
        <SimpleGrid columns={{ base: 1, xl: 2 }} gap={4}>
          {filteredProjects.map((record) => {
            const projectId = record.id ? String(record.id) : "";
            const hasId = Boolean(record.id);
            const title = record.title || "Untitled Project";
            const isActive = record.is_active ?? true;
            const integrations = [
              record.website_url,
              record.github_url,
              record.jira_url,
              record.trello_url,
              record.monday_url,
            ].filter(Boolean) as string[];

            return (
              <Card.Root
                key={record.id ?? title}
                border="sm"
                borderColor="border.subtle"
                bg="bg.surface"
                shadow="sm"
              >
                <Card.Body p={5}>
                  <Stack gap={4}>
                    <Flex justify="space-between" align="start" gap={3}>
                      <Stack gap={1}>
                        <Heading size="md" color="fg.heading">
                          {title}
                        </Heading>
                        <Text color="fg.subtle" fontSize="sm">
                          {record.description || "No project description yet."}
                        </Text>
                      </Stack>
                      <Badge
                        colorPalette={isActive ? "green" : "gray"}
                        variant="subtle"
                      >
                        {isActive ? "Active" : "Inactive"}
                      </Badge>
                    </Flex>

                    <HStack flexWrap="wrap" gap={2}>
                      {record.code && (
                        <Badge colorPalette="blue" variant="outline">
                          Code: {record.code}
                        </Badge>
                      )}
                      {record.version && (
                        <Badge colorPalette="purple" variant="outline">
                          Version: {record.version}
                        </Badge>
                      )}
                      {record.updated_at && (
                        <Badge colorPalette="orange" variant="outline">
                          Updated:{" "}
                          {new Date(record.updated_at).toLocaleDateString()}
                        </Badge>
                      )}
                    </HStack>

                    {integrations.length > 0 && (
                      <Stack gap={1}>
                        <Text fontSize="xs" color="fg.subtle">
                          Integrations
                        </Text>
                        <HStack flexWrap="wrap" gap={3}>
                          {integrations.map((integrationUrl) => (
                            <ChakraLink
                              key={integrationUrl}
                              href={integrationUrl}
                              color="fg.accent"
                              fontSize="sm"
                              display="inline-flex"
                              alignItems="center"
                              gap={1}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Icon as={IconLink} />
                              {getIntegrationLabel(integrationUrl)}
                            </ChakraLink>
                          ))}
                        </HStack>
                      </Stack>
                    )}

                    <Separator />

                    <Flex wrap="wrap" gap={2}>
                      {hasId ? (
                        <Link to="/projects/$projectId" params={{ projectId }}>
                          <Button
                            variant="outline"
                            colorPalette="brand"
                            size="sm"
                          >
                            Open Workspace
                          </Button>
                        </Link>
                      ) : (
                        <Button variant="outline" colorPalette="brand" size="sm" disabled>
                          Open Workspace
                        </Button>
                      )}
                      {hasId ? (
                        <Link
                          to="/projects/$projectId/test-cases/new"
                          params={{ projectId }}
                        >
                          <Button variant="outline" colorPalette="blue" size="sm">
                            Add Test Case
                          </Button>
                        </Link>
                      ) : (
                        <Button variant="outline" colorPalette="blue" size="sm" disabled>
                          Add Test Case
                        </Button>
                      )}
                      {hasId ? (
                        <Link
                          to="/projects/$projectId/test-plans/new"
                          params={{ projectId }}
                        >
                          <Button variant="outline" colorPalette="teal" size="sm">
                            New Test Plan
                          </Button>
                        </Link>
                      ) : (
                        <Button variant="outline" colorPalette="teal" size="sm" disabled>
                          New Test Plan
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        colorPalette="danger"
                        size="sm"
                        loading={deleteMutation.isPending}
                        onClick={() =>
                          hasId && handleDelete(record.id!, record.title || title)
                        }
                        disabled={!hasId}
                      >
                        <IconTrash />
                        Delete
                      </Button>
                    </Flex>
                  </Stack>
                </Card.Body>
              </Card.Root>
            );
          })}
        </SimpleGrid>
      )}
    </Box>
  );
}
