import { createFileRoute } from "@tanstack/react-router";
import {Box, Heading, Spinner, Text} from "@chakra-ui/react";
import {ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid} from "recharts";
import { useProjectSummaryQuery } from "@/services/ProjectSummaryService";

export const Route = createFileRoute("/(project)/projects/$projectId/summary/")({
  component: SummaryPage,
});

function SummaryPage() {
    const {projectId} = Route.useParams();
    const {data, isLoading, error} = useProjectSummaryQuery(projectId);

    if (isLoading) {
        return <Spinner size="xl" color="brand.solid" />;
    }
    if (error) {
        return <Text color="red.500">Error loading project summary</Text>;
    }

    if (!data) {
        return <Text>No summary data available</Text>;
    }

    const chartData = [
  { name: "Completed", value: data.completed, color: "#4CAF50" },   
  { name: "Incomplete", value: data.incomplete, color: "#2196F3" }, 
  { name: "Passed", value: data.passed, color: "#2E7D32" },         
  { name: "Failed", value: data.failed, color: "#F44336" },         
  { name: "Pending", value: data.pending, color: "#FF9800" },       
  { name: "Blocked", value: data.blocked, color: "#9E9E9E" },       
];

    return (
      <Box p={6}>
        <Heading mb={4}>Project Summary</Heading>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar
              dataKey="value"
              shape={(props) => {
                const { x, y, width, height, payload } = props;
                return (
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={payload.color}
                  />
                );
              }}
            />

          </BarChart>

        </ResponsiveContainer>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>

      </Box>
    );
  }