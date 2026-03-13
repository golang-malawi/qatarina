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
            <Text fontWeight="bold">Name:</Text>
            <Text mb={2}>{env?.name}</Text>
            
              <Text fontWeight="bold">Description:</Text>
              <Text mb={2}>
                {env?.description && env.description.trim().length > 0
                  ? env.description
                  : "No description provided."}
                  </Text>
         
            <Text fontWeight="bold">Base URL:</Text>
            <Text mb={2} color="blue.500">
              {env?.base_url && env.base_url.trim().length > 0
              ? env.base_url
              : "No base URL provided."}
              </Text>

            <Text fontSize="sm" color="gray.500">
              Created at: {env?.created_at}
            </Text>
            <Text fontSize="sm" color="gray.500">
              Updated at: {env?.updated_at}
            </Text>
        </Box>
    );    
}