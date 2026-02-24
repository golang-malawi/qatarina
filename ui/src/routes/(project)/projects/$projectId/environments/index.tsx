import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Box,
  Button,
  Heading,
  Spinner,
  Text,
  Flex,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { getProjectEnvironments } from "@/services/EnvironmentService";
import { List } from "@chakra-ui/react/list";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/environments/"
)({
  component: EnvironmentsPage,
});

function EnvironmentsPage() {
  const { projectId } = Route.useParams();

  const { data, isLoading, error } = useQuery<
    Awaited<ReturnType<typeof getProjectEnvironments>>
  >({
    queryKey: ["environments", projectId],
    queryFn: () => getProjectEnvironments(projectId),
  });

  if (isLoading) return <Spinner />;
  if (error) return <Text color="red.500">Failed to load environments.</Text>;

  return (
    <Box>
      <Heading size="md" mb={4}>
        Project Environments
      </Heading>
      <List.Root gap={3}>
        {data?.data?.environments?.map((env) => (
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
              <Button size="sm" mt={2}>View</Button>
             </Link>     
            </Flex>       
          </List.Item>
        ))}
      </List.Root>
    </Box>
  );
}