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
import { Route as ProjectOverviewRoute } from "@/routes/(project)/projects/$projectId/overview";
import { useTranslation } from "react-i18next";

type ProjectRecord = {
  id?: number;
  project_owner_id: number;
  title?: string;
  description?: string;
  code?: string;
  version?: string;
  website_url?: string;
  github_url?: string;
  parent_project_id?: number;
  jira_url?: string;
  trello_url?: string;
  monday_url?: string;
  is_active?: boolean;
  updated_at?: string;
  environments?: {
    name: string;
    description?: string;
    base_url?: string;
  }[];
};

export const Route = createFileRoute("/workspace/projects/")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData($api.queryOptions("get", "/v1/projects")),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const projectsQueryOptions = $api.queryOptions("get", "/v1/projects");

  const { data, isPending, error } = useSuspenseQuery(projectsQueryOptions);

  const deleteMutation = $api.useMutation("delete", "/v1/projects/{projectID}");
  const projectRecords = useMemo(
    () => (data?.projects ?? []) as ProjectRecord[], [data]);
  const filteredProjects = useMemo(() => {
    const term = (typeof searchTerm === "string" ? searchTerm : "").trim().toLowerCase();
    if (!term) return projectRecords;
    return projectRecords.filter((record) => {
      const searchable = [
        record.title ?? "",
        record.description ?? "",
        record.code ?? "",
        record.version ?? "",
      ]
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
    return <Text color="fg.error">{t("projects.error.load")}</Text>;
  }

  const handleDelete = (projectID: number, title: string) => {
    if (confirm(t("projects.delete.confirm"))) {
      deleteMutation.mutate(
        { params: { path: { projectID: projectID.toString() } } },
        {
          onSuccess: () => {
            toaster.create({
              title: t("projects.delete.success"),
              description: t("projects.delete.success_with_name", { title }),
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
              title: t("projects.delete.error"),
              description: error?.message ?? t("projects.delete.error_generic"),
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
                  {t("projects.workspace")}
                </Heading>
              </HStack>
              <Text color="fg.subtle">
                {t("projects.workspace_description")}
              </Text>
              <HStack gap={2}>
                <Badge colorPalette="brand" variant="subtle">
                  {filteredProjects.length} {t("projects.shown")}
                </Badge>
                <Badge colorPalette="gray" variant="subtle">
                  {projectRecords.length} {t("projects.total")}
                </Badge>
              </HStack>
            </Stack>

            <Link to="/workspace/projects/new">
              <Button colorPalette="brand">
                <IconPlus />
                {t("projects.create")}
              </Button>
            </Link>
          </Flex>
        </Card.Body>
      </Card.Root>

      <Card.Root border="sm" borderColor="border.subtle" bg="bg.surface" mb={6}>
        <Card.Body p={{ base: 4, md: 5 }}>
          <InputGroup startElement={<IconSearch size={16} />}>
            <Input
              value={searchTerm ?? ""}
              onChange={(event) => setSearchTerm(event.target.value ?? "")}
              placeholder={t("projects.search_placeholder")}
            />
          </InputGroup>
        </Card.Body>
      </Card.Root>

      {filteredProjects.length === 0 ? (
        <Card.Root border="sm" borderColor="border.subtle" bg="bg.surface">
          <Card.Body p={{ base: 8, md: 10 }}>
            <Stack align="center" gap={3} textAlign="center">
              <Heading size="md" color="fg.heading">
                {t("projects.empty")}
              </Heading>
              <Text color="fg.subtle" maxW="lg">
                {t("projects.empty_description")}
              </Text>
              <Link to="/workspace/projects/new">
                <Button colorPalette="brand">
                  <IconPlus />
                  {t("projects.create_new")}
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
            const title = record.title || t("projects.untitled");
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
                          {record.description || t("projects.no_description")}
                        </Text>
                      </Stack>
                      <Badge
                        colorPalette={isActive ? "green" : "gray"}
                        variant="subtle"
                      >
                        {isActive
                          ? t("projects.status.active")
                          : t("projects.status.inactive")}
                      </Badge>
                    </Flex>

                    <HStack flexWrap="wrap" gap={2}>
                      {record.code && (
                        <Badge colorPalette="blue" variant="outline">
                          {t("projects.code")}: {record.code}
                        </Badge>
                      )}
                      {record.version && (
                        <Badge colorPalette="purple" variant="outline">
                          {t("projects.version")}: {record.version}
                        </Badge>
                      )}
                      {record.updated_at && (
                        <Badge colorPalette="orange" variant="outline">
                          {t("projects.updated")}:{" "}
                          {new Date(record.updated_at).toLocaleDateString()}
                        </Badge>
                      )}
                    </HStack>

                    {integrations.length > 0 && (
                      <Stack gap={1}>
                        <Text fontSize="xs" color="fg.subtle">
                          {t("projects.integrations")}
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
                        <Link to={ProjectOverviewRoute.to} params={{ projectId }}>
                          <Button variant="outline" colorPalette="brand" size="sm">
                            {t("projects.open_workspace")}
                          </Button>
                        </Link>
                      ) : (
                        <Button variant="outline" colorPalette="brand" size="sm" disabled>
                          {t("projects.open_workspace")}
                        </Button>
                      )}

                      {hasId && isActive ? (
                        <Link to="/projects/$projectId/test-cases/new" params={{ projectId }}>
                          <Button variant="outline" colorPalette="blue" size="sm">
                            {t("projects.add_test_case")}
                          </Button>
                        </Link>
                      ) : (
                        <Button variant="outline" colorPalette="blue" size="sm" disabled>
                          {t("projects.add_test_case")}
                        </Button>
                      )}

                      {hasId && isActive ? (
                        <Link to="/projects/$projectId/test-plans/new" params={{ projectId }}>
                          <Button variant="outline" colorPalette="teal" size="sm">
                            {t("projects.new_test_plan")}
                          </Button>
                        </Link>
                      ) : (
                        <Button variant="outline" colorPalette="teal" size="sm" disabled>
                          {t("projects.new_test_plan")}
                        </Button>
                      )}

                      {hasId && isActive ? (
                        <Link to="/workspace/projects/$projectId/edit" params={{ projectId }}>
                          <Button variant="outline" colorPalette="orange" size="sm">
                            {t("projects.edit_button")}
                          </Button>
                        </Link>
                      ) : (
                        <Button variant="outline" colorPalette="orange" size="sm" disabled>
                          {t("projects.edit_button")}
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        colorPalette="danger"
                        size="sm"
                        loading={deleteMutation.isPending}
                        onClick={() =>
                          hasId && isActive && handleDelete(record.id!, record.title || title)
                        }
                        disabled={!hasId || !isActive}
                      >
                        <IconTrash />
                        {t("projects.delete")}
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
