import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Heading,
  Text,
  Stack,
  Spinner,
} from "@chakra-ui/react";
import { IconDashboard } from "@tabler/icons-react";
import axios from "axios";
import { SummaryCard } from "../../../components/SummaryCard";

interface Project {
  id: number;
  name: string;
  updated_at: string;
}

interface DashboardSummary {
  project_count: number;
  tester_count: number;
  test_case_count: number;
  test_plan_count: number;
  closed_to_open_ratio: number;
  recent_projects: Project[];
}

function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get<{ data: DashboardSummary }>("http://localhost:4597/v1/dashboard/summary", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((res) => {
        console.log("Full response:", res.data);
        console.log("Ratio value:", res.data.data.closed_to_open_ratio);
        setData(res.data.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load dashboard", err);
        setLoading(false);
      });
  }, []);

  return (
    <Box p={6}>
      <Heading mb={6} display="flex" alignItems="center" gap={2}>
        <IconDashboard /> Dashboard
      </Heading>

      {loading ? (
        <Spinner size="xl" />
      ) : data ? (
        <>
          <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={6}>
            <SummaryCard label="Projects" value={data.project_count} />
            <SummaryCard label="Testers" value={data.tester_count} />
            <SummaryCard label="Test Cases" value={data.test_case_count} />
            <SummaryCard label="Test Plans" value={data.test_plan_count} />
            <SummaryCard
              label="Closed/Open Ratio"
              value={
                typeof data.closed_to_open_ratio === "number"
                  ? data.closed_to_open_ratio.toFixed(2)
                  : "N/A"
              }
            />
          </Grid>

          <Box mt={10}>
            <Heading size="md" mb={4}>
              Recently Updated Projects
            </Heading>
            <Stack direction="column" align="start" gap={4}>
              {Array.isArray(data.recent_projects) && data.recent_projects.length > 0 ? (
                data.recent_projects.map((project) => (
                  <Box
                    key={project.id}
                    p={3}
                    borderWidth="1px"
                    borderRadius="md"
                    w="100%"
                    bg="white"
                  >
                    <Text fontWeight="bold">{project.name}</Text>
                    <Text fontSize="sm" color="gray.500">
                      Updated at: {new Date(project.updated_at).toLocaleString()}
                    </Text>
                  </Box>
                ))
              ) : (
                <Text>No recent projects found.</Text>
              )}
            </Stack>
          </Box>
        </>
      ) : (
        <Text color="red.500">Failed to load dashboard data.</Text>
      )}
    </Box>
  );
}

export const Route = createFileRoute("/(app)/dashboard/")({
  component: DashboardPage,
});
