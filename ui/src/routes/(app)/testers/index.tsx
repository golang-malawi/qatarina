import {
  Box,
  Stack,
  Table,
  Heading,
  Button,
  Flex,
  Spinner,

  IconButton,
  Alert,

} from "@chakra-ui/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTestersQuery } from "@/services/TesterService";
import { LuTrash, LuPencil } from "react-icons/lu";

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

  const handleEdit = (id: number) => {
    console.log("Edit tester", id);
  };

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg">Testers</Heading>
        <Link to="/testers/CreateTesterForm">
          <Button colorScheme="teal">+ Add New Tester</Button>
        </Link>
      </Flex>

      {isPending ? (
        <Flex justify="center" py={10}>
          <Spinner size="lg" />
        </Flex>
      ) : isError ? (
        <Alert status="error" my={4}>
          Failed to load testers: {(error as Error).message}
        </Alert>
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
                        <Link to={`/testers/view/${tester.user_id}`}>
                          View
                        </Link>
                      </Button>
                      <Button>
                        <Link to={`/testers/edit/${tester.user_id}`}>
                          Edit
                        </Link>
                      </Button>
                      <Button
                        colorScheme="red"
                        onClick={() => handleDelete(tester.user_id)}
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