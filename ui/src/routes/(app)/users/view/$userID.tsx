import { createFileRoute } from "@tanstack/react-router";
import { Box, Heading } from "@chakra-ui/react";

export const Route = createFileRoute("/(app)/users/view/$userID")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Box>
      <Heading>View Profile: </Heading>
    </Box>
  );
}
