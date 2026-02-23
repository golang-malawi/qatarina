import { Box, Heading } from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/workspace/reports/")({
  component: ListReports,
});

function ListReports() {
  return (
    <Box>
      <Heading>Reports</Heading>
    </Box>
  );
}
