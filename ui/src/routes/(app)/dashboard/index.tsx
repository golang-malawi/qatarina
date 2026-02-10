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

  if (isPending) return <Spinner size="xl" color="brand.solid" />;
  if (error) return <Text color="fg.error">Failed to load dashboard data.</Text>;

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
      <Heading
        mb={6}
        display="flex"
        alignItems="center"
        gap={2}
        color="fg.heading"
      >
        <IconDashboard /> Dashboard
      </Heading>

      <Grid
        templateColumns="repeat(auto-fit, minmax(var(--chakra-sizes-64), 1fr))"
        gap={6}
      >
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
        <Heading size="md" mb={4} color="fg.heading">
          Recently Updated Projects
        </Heading>
        <Stack direction="column" align="start" gap={4}>
          {Array.isArray(recent_projects) && recent_projects.length > 0 ? (
            recent_projects.map(({ id, name, updated_at }) => (
              <Box
                key={id}
                p={3}
                border="sm"
                borderColor="border.subtle"
                borderRadius="lg"
                w="100%"
                bg="bg.surface"
                shadow="sm"
              >
                <Text fontWeight="bold" color="fg.heading">
                  {name}
                </Text>
                <Text fontSize="sm" color="fg.subtle">
                  Updated at: {new Date(updated_at).toLocaleString()}
                </Text>
              </Box>
            ))
          ) : (
            <Text color="fg.muted">No recent projects found.</Text>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

export const Route = createFileRoute("/(app)/dashboard/")({
  component: DashboardPage,
});
