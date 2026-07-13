import { createFileRoute, Link } from "@tanstack/react-router";
import { Box, Button, Heading, Spinner, Text, Flex } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { getProjectEnvironments } from "@/services/EnvironmentService";
import { List } from "@chakra-ui/react/list";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/environments/"
)({
  component: EnvironmentsPage,
});

function EnvironmentsPage() {
  const { t } = useTranslation();
  const { projectId } = Route.useParams();

  const { data, isLoading, error } = useQuery<
    Awaited<ReturnType<typeof getProjectEnvironments>>
  >({
    queryKey: ["environments", projectId],
    queryFn: () => getProjectEnvironments(projectId),
  });

  const environments = data?.data?.environments ?? [];

  if (isLoading) return <Spinner />;
  if (error) return <Text color="red.500">{t("environments.index.error")}</Text>;

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">{t("environments.index.title")}</Heading>
        <Link
          to="/projects/$projectId/environments/new"
          params={{ projectId }}
          search={{ from: "_self" }}
        >
          <Button colorScheme="blue" size="sm">
            + {t("environments.index.add_button")}
          </Button>
        </Link>
      </Flex>

      <List.Root gap={3}>
        {environments.length === 0 ? (
          <Text color="gray.500">{t("environments.index.empty")}</Text>
        ) : (
          environments.map((env) => (
            <List.Item
              key={env.id}
              border="1px solid #ccc"
              p={3}
              borderRadius="md"
            >
              <Flex justify="space-between" align="center">
                <Box>
                  <Text fontWeight="bold">{env.name}</Text>
                  {env.description && <Text>{env.description}</Text>}
                  {env.base_url && <Text color="blue.500">{env.base_url}</Text>}
                </Box>
                <Link
                  to="/projects/$projectId/environments/$environmentId"
                  params={{ projectId, environmentId: String(env.id) }}
                >
                  <Button size="sm" mt={2}>
                    {t("environments.index.view")}
                  </Button>
                </Link>
              </Flex>
            </List.Item>
          ))
        )}
      </List.Root>
    </Box>
  );
}
