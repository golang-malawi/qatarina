import { Box, Heading } from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/settings/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Box>
      <Heading size="3xl">Settings</Heading>
    </Box>
  );
}
