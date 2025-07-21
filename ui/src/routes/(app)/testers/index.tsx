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
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LuTrash, LuPencil } from "react-icons/lu";

export const Route = createFileRoute("/(app)/testers/")({
  component: ListTesters,
});

type Tester = {
  id: string;
  name: string;
  email: string;
};

function ListTesters() {
  const [testers, setTesters] = useState<Tester[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        setTesters([
          { id: "1", name: "Alice Johnson", email: "alice@example.com" },
          { id: "2", name: "Bob Smith", email: "bob@example.com" },
          { id: "3", name: "Charlie Brown", email: "charlie@example.com" },
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
    if (!window.confirm("Are you sure you want to delete this tester?")) return;
    setTesters((prev) => prev.filter((t) => t.id !== id));
  };

  const handleEdit = (id: string) => {
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
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {testers.map((tester) => (
                <Table.Row key={tester.id}>
                  <Table.Cell>{tester.id}</Table.Cell>
                  <Table.Cell>{tester.name}</Table.Cell>
                  <Table.Cell>{tester.email}</Table.Cell>
                  <Table.Cell>
                    <Flex gap={2}>
                      <IconButton
                        aria-label="Edit tester"
                        onClick={() => handleEdit(tester.id)}
                        colorScheme="blue"
                        size="sm"
                        icon={<LuPencil />}
                      />
                      <IconButton
                        aria-label="Delete tester"
                        onClick={() => handleDelete(tester.id)}
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
