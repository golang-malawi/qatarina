import { createFileRoute } from "@tanstack/react-router";
import {
  Box,
  Grid,
  Heading,
  Text,
  Stack,
  Spinner,
} from "@chakra-ui/react";
import { IconDashboard } from "@tabler/icons-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import $api from "@/lib/api/query";
import { SummaryCard } from "../../../components/SummaryCard";

function DashboardPage() {
  const {
    data,
    isPending,
    error,
  } = useSuspenseQuery($api.queryOptions("get", "/v1/dashboard/summary" as any, {}));

  if (isPending) return <Spinner size="xl" />;
  if (error) return <Text color="red.500">Failed to load dashboard data.</Text>;

  const {
    project_count,
    tester_count,
    test_case_count,
    test_plan_count,
    closed_to_open_ratio,
    recent_projects,
  } = data;

  return (
    <Box p={6}>
      <Heading mb={6} display="flex" alignItems="center" gap={2}>
        <IconDashboard /> Dashboard
      </Heading>

      <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={6}>
        <SummaryCard label="Projects" value={project_count} />
        <SummaryCard label="Testers" value={tester_count} />
        <SummaryCard label="Test Cases" value={test_case_count} />
        <SummaryCard label="Test Plans" value={test_plan_count} />
        <SummaryCard
          label="Closed/Open Ratio"
          value={
            typeof closed_to_open_ratio === "number"
              ? closed_to_open_ratio.toFixed(2)
              : "N/A"
          }
        />
      </Grid>

      <Box mt={10}>
        <Heading size="md" mb={4}>
          Recently Updated Projects
        </Heading>
        <Stack direction="column" align="start" gap={4}>
          {Array.isArray(recent_projects) && recent_projects.length > 0 ? (
            recent_projects.map(({ id, name, updated_at }) => (
              <Box
                key={id}
                p={3}
                borderWidth="1px"
                borderRadius="md"
                w="100%"
                bg="white"
              >
                <Text fontWeight="bold">{name}</Text>
                <Text fontSize="sm" color="gray.500">
                  Updated at: {new Date(updated_at).toLocaleString()}
                </Text>
              </Box>
            ))
          ) : (
            <Text>No recent projects found.</Text>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

export const Route = createFileRoute("/(app)/dashboard/")({
  component: DashboardPage,
});
