import { Box, Button, Heading } from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/testers/")({
  component: ListTesters,
});

function ListTesters() {
  return (
    <Box>
      <Heading>Testers</Heading>

      <Button>Add New Tester</Button>
      <Button>Invite a Tester</Button>
    </Box>
  );
}
