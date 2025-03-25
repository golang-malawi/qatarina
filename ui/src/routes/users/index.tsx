import { createFileRoute } from "@tanstack/react-router";
import { Box, Heading } from "@chakra-ui/react";

export const Route = createFileRoute("/users/")({ component: RouteComponent });

function RouteComponent() {
  return (
    <Box>
      <Heading>Users</Heading>
    </Box>
  );
}
