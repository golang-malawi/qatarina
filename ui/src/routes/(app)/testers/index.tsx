import { Box, Button, Heading } from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/testers/")({
  component: ListTesters,
});

function ListTesters() {
  return (
    <Box>
      <Heading size="3xl">Testers</Heading>

      <Button>Add New Tester</Button>
      {/* TODO(zikani03): <Button>Invite a Tester</Button> */}
    </Box>
  );
}
