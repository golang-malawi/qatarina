import {
  Box,
  Stack,
  Table,
  Heading,
  Button,
  Flex,
  Spinner,
  Text,
  IconButton,
  SimpleGrid,
} from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LuEye, LuDownload, LuTrash } from "react-icons/lu";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/reports/"
)({
  component: ReportsPage,
});

type Report = {
  id: string;
  name: string;
  type: string;
  status: string;
  createdAt: string;
};

function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        setReports([
          {
            id: "RPT-001",
            name: "QA Summary Report",
            type: "Summary",
            status: "Completed",
            createdAt: "2025-07-14",
          },
          {
            id: "RPT-002",
            name: "Bug Trend Analysis",
            type: "Analytics",
            status: "In Progress",
            createdAt: "2025-07-13",
          },
          {
            id: "RPT-003",
            name: "Regression Test Report",
            type: "Detailed",
            status: "Failed",
            createdAt: "2025-07-11",
          },
        ]);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to load reports.");
        setLoading(false);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  const handleDelete = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    setReports((prev) => prev.filter((r) => r.id !== id));
  };

  const handleView = (id: string) => {
    console.log("View report", id);
  };

  const handleDownload = (id: string) => {
    console.log("Download report", id);
  };

  const totalReports = reports.length;
  const completedReports = reports.filter((r) => r.status === "Completed").length;
  const inProgressReports = reports.filter((r) => r.status === "In Progress").length;
  const failedReports = reports.filter((r) => r.status === "Failed").length;

  return (
    <Box p={6}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg">Reports</Heading>
        <Button colorScheme="teal">+ Generate New Report</Button>
      </Flex>

      {/* Summary Cards */}
      <SimpleGrid columns={[1, 2, 4]} gap={4} mb={6}>
        <Box p={4} shadow="sm" borderRadius="md" bg="gray.100">
          <Text fontSize="sm" color="gray.600">
            Total Reports
          </Text>
          <Heading size="lg">{totalReports}</Heading>
          <Text fontSize="xs" color="gray.500">
            Across all statuses
          </Text>
        </Box>

        <Box p={4} shadow="sm" borderRadius="md" bg="gray.100">
          <Text fontSize="sm" color="gray.600">
            Completed
          </Text>
          <Heading size="lg" color="green.500">
            {completedReports}
          </Heading>
        </Box>

        <Box p={4} shadow="sm" borderRadius="md" bg="gray.100">
          <Text fontSize="sm" color="gray.600">
            In Progress
          </Text>
          <Heading size="lg" color="yellow.500">
            {inProgressReports}
          </Heading>
        </Box>

        <Box p={4} shadow="sm" borderRadius="md" bg="gray.100">
          <Text fontSize="sm" color="gray.600">
            Failed
          </Text>
          <Heading size="lg" color="red.500">
            {failedReports}
          </Heading>
        </Box>
      </SimpleGrid>

      {/* Report Table */}
      {loading ? (
        <Flex justify="center" py={10}>
          <Spinner size="lg" />
        </Flex>
      ) : error ? (
        <Text color="red.500">{error}</Text>
      ) : (
        <Stack gap="6">
          <Table.Root size="md">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>ID</Table.ColumnHeader>
                <Table.ColumnHeader>Name</Table.ColumnHeader>
                <Table.ColumnHeader>Type</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Created At</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {reports.map((report) => (
                <Table.Row key={report.id}>
                  <Table.Cell>{report.id}</Table.Cell>
                  <Table.Cell>{report.name}</Table.Cell>
                  <Table.Cell>{report.type}</Table.Cell>
                  <Table.Cell>{report.status}</Table.Cell>
                  <Table.Cell>{report.createdAt}</Table.Cell>
                  <Table.Cell>
                    <Flex gap={2}>
                      <IconButton
                        aria-label="View report"
                        onClick={() => handleView(report.id)}
                        colorScheme="blue"
                        size="sm"
                        icon={<LuEye />}
                      />
                      <IconButton
                        aria-label="Download report"
                        onClick={() => handleDownload(report.id)}
                        colorScheme="green"
                        size="sm"
                        icon={<LuDownload />}
                      />
                      <IconButton
                        aria-label="Delete report"
                        onClick={() => handleDelete(report.id)}
                        colorScheme="red"
                        size="sm"
                        icon={<LuTrash />}
                      />
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Stack>
      )}
    </Box>
  );
}
