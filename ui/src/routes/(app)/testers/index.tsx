import {
  Box,
  Stack,
  Table,
  Heading,
  Button,
  Flex,
  Spinner,
} from "@chakra-ui/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTestersQuery } from "@/services/TesterService";
import ErrorAlert from "@/components/ui/error-alert";

export const Route = createFileRoute("/(app)/testers/")({
  component: ListTesters,
});

function ListTesters() {
  const { data, isPending, isError, error } = useTestersQuery();

  const testers = data?.testers ?? [];

  const handleDelete = (id: number) => {
    if (!window.confirm("Are you sure you want to delete this tester?")) return;
    console.log("Delete tester", id);
  };

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg">Testers</Heading>
        <Link to="/testers/invite">
          <Button colorScheme="teal">+ Add New Tester</Button>
        </Link>
      </Flex>

      {isPending ? (
        <Flex justify="center" py={10}>
          <Spinner size="lg" />
        </Flex>
      ) : isError ? (
        <ErrorAlert message={`Failed to load testers: ${(error as Error).message}`} />
      ) : (
        <Stack gap="6">
          <Table.Root size="md">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>User ID</Table.ColumnHeader>
                <Table.ColumnHeader>Name</Table.ColumnHeader>
                <Table.ColumnHeader>Project</Table.ColumnHeader>
                <Table.ColumnHeader>Role</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {testers.map((tester) => (
                <Table.Row key={tester.user_id}>
                  <Table.Cell>{tester.user_id}</Table.Cell>
                  <Table.Cell>{tester.name || "N/A"}</Table.Cell>
                  <Table.Cell>{tester.project || "N/A"}</Table.Cell>
                  <Table.Cell>{tester.role || "N/A"}</Table.Cell>
                  <Table.Cell>
                    <Flex gap={2}>
                      <Button>
                        <Link to={`/testers/view/$testerId`} params={{  testerId: `${tester.user_id!}` }}>
                          View
                        </Link>
                      </Button>
                      <Button
                        colorScheme="red"
                        onClick={() => handleDelete(tester.user_id!)}
                        size="sm"
                      >
                        Delete
                      </Button>

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