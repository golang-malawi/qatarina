import { createFileRoute } from "@tanstack/react-router";
import { Box, Heading, Spinner, Text } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { getEnvironment } from "@/services/EnvironmentService";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/environments/$environmentId"
)({
  component: EnvironmentDetailPage,
});

function EnvironmentDetailPage() {
  const { environmentId } = Route.useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["environment", environmentId],
    queryFn: () => getEnvironment(environmentId),
    });

    if (isLoading) return <Spinner />;
    if (error) return <Text color="red.500">Failed to load environment details.</Text>;

    const env = data?.data;

    return (
        <Box>
          <Heading size="lg" mb={4}>
            Environment Details
          </Heading>

            <Heading size="md">{env?.name}</Heading>
            {env?.description && <Text>{env.description}</Text>}
            {env?.base_url && <Text color="blue.500">{env.base_url}</Text>}
            <Text fontSize="sm" color="gray.500">
                Created at: {env?.created_at}
                </Text>
            <Text fontSize="sm" color="gray.500">
                Updated at: {env?.updated_at}</Text>
        </Box>
    );    
}