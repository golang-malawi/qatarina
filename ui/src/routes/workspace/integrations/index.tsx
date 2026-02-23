import { Box, Heading } from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/workspace/integrations/")({
  component: ListIntegrations,
});

function ListIntegrations() {
  return (
    <Box>
      <Heading>Integrations</Heading>
    </Box>
  );
}
