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
} from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import { LuPencil, LuTrash } from "react-icons/lu";
import {useProjectTestersQuery} from "@/services/TesterService";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/testers/"
)({
  component: ProjectTestersPage,
});

type Tester = {
  id: string;
  name: string;
  email: string;
  role: string;
};

function ProjectTestersPage() {
  const {projectId} = Route.useParams();
  const projectID = Number(projectId)

  const {data, isPending, isError, error} = useProjectTestersQuery(projectID);

  if (isPending) {
    return(
      <Flex justify="center" py={10}>
        <Spinner size="lg" />
      </Flex>
    );
  }

  if (isError) {
    return(
      <Text color="red.500">
        Failed to load testers: {error?.detail ?? error?.title ?? "Unknown error"}
      </Text>
    ); 
  }

  const testers: Tester[] =
    data?.testers?.map((t: any) => ({
      id: String(t.user_id),
      name: t.name,
      email: t.email ?? "N/A",
      role: t.role,
    })) ?? [];

  const handleDelete = (id: string) => {
    if (!window.confirm("Are you sure you want to remove this tester?")) return;
    // TODO: call backend delete endpoint here
    console.log("Delete tester", id);
  };

  const handleEdit = (id: string) => {
    console.log("Edit tester", id);
    // TODO: navigate to edit form
  };

  return (
    <Box p={6}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg">Project Testers</Heading>
        <Button colorScheme="teal">+ Add New Tester</Button>
      </Flex>

      {/* Total Testers */}
      <Text mb={4} color="gray.600">
        Total Testers: <strong>{testers.length}</strong>
      </Text>

      {/* Tester Table */}
        <Stack gap="6">
          <Table.Root size="md">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>ID</Table.ColumnHeader>
                <Table.ColumnHeader>Name</Table.ColumnHeader>
                <Table.ColumnHeader>Email</Table.ColumnHeader>
                <Table.ColumnHeader>Role</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {testers.map((tester) => (
                <Table.Row key={tester.id}>
                  <Table.Cell>{tester.id}</Table.Cell>
                  <Table.Cell>{tester.name}</Table.Cell>
                  <Table.Cell>{tester.email}</Table.Cell>
                  <Table.Cell>{tester.role}</Table.Cell>
                  <Table.Cell>
                    <Flex gap={2}>
                      <IconButton
                        aria-label="Edit tester"
                        onClick={() => handleEdit(tester.id)}
                        colorScheme="blue"
                        size="sm"
                        children={<LuPencil />}
                      />
                      <IconButton
                        aria-label="Delete tester"
                        onClick={() => handleDelete(tester.id)}
                        colorScheme="red"
                        size="sm"
                        children={<LuTrash />}
                      />
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Stack>
    </Box>
  );
}
