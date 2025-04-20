import { createFileRoute } from "@tanstack/react-router";
import { Alert, Box, Flex, Heading } from "@chakra-ui/react";

export const Route = createFileRoute("/(app)/projects/$projectId/")({
  component: ViewProject,
});

function ViewProject() {
  const { projectId } = Route.useParams();
  return (
    <Box data-project-id={projectId}>
      <Alert>
        Manage your Project and it's Test Plans, Testers, and Integrations.
      </Alert>
    </Box>
  );
}
