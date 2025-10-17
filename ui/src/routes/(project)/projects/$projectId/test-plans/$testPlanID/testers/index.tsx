import { Box, Button, Flex, Heading, IconButton, Spinner, Stack, Table, Text } from '@chakra-ui/react';
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react';
import { LuPencil, LuTrash } from 'react-icons/lu';

export const Route = createFileRoute(
  '/(project)/projects/$projectId/test-plans/$testPlanID/testers/',
)({
  component: RouteComponent,
})

type Tester = {
  id: string;
  name: string;
  email: string;
  role: string;
};


function RouteComponent() {
const [testers, setTesters] = useState<Tester[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        setTesters([
          {
            id: "1",
            name: "Alice Johnson",
            email: "alice@example.com",
            role: "Lead Tester",
          },
          {
            id: "2",
            name: "Bob Smith",
            email: "bob@example.com",
            role: "QA Engineer",
          },
          {
            id: "3",
            name: "Charlie Brown",
            email: "charlie@example.com",
            role: "Junior Tester",
          },
        ]);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to load testers.");
        setLoading(false);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  const handleDelete = (id: string) => {
    if (!window.confirm("Are you sure you want to remove this tester?")) return;
    setTesters((prev) => prev.filter((t) => t.id !== id));
  };

  const handleEdit = (id: string) => {
    console.log("Edit tester", id);
  };

  return (
    <Box p={6}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg">Testers Assigned to this Plan</Heading>
        <Button colorScheme="teal">+ Add New Tester</Button>
      </Flex>

      {/* Total Testers */}
      <Text mb={4} color="gray.600">
        Total Testers: <strong>{testers.length}</strong>
      </Text>

      {/* Tester Table */}
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
      )}
    </Box>
  );
}
