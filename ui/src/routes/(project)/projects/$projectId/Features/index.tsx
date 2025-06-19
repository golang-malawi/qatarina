import {
  Box,
  Stack,
  Table,
  Heading,
  Button,
  Flex,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import ModuleService, { Module } from "@/services/ModuleService";
import { IconButton } from "@chakra-ui/react";
import { LuBrush, LuTrash } from "react-icons/lu";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/Features/"
)({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const projectId = params.projectId;

  const [features, setFeatures] = useState<Module[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const service = new ModuleService();
        const data = await service.getAllModules();
        setFeatures(
          data.filter((item) => item.project_id == Number(projectId))
        );
      } catch (err: any) {
        console.error(err);
        setError("Failed to load modules.");
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, [projectId]);
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this module?")) return;

    try {
      const service = new ModuleService();
      await service.deleteModule(id);
      setFeatures((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete module.");
    }
  };

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg">Features / Modules / Components</Heading>
        <Button
          as={Link}
          to="/projects/$projectId/Features/CreateFeatureModuleForm"
          params={{ projectId }}
          colorScheme="teal"
        >
          + Create New
        </Button>
      </Flex>

      {loading ? (
        <Flex justify="center" py={10}>
          <Spinner size="lg" />
        </Flex>
      ) : error ? (
        <Text color="red.500">{error}</Text>
      ) : (
        <Stack gap="6">
          <Table.Root size="md" variant="striped">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Name</Table.ColumnHeader>
                <Table.ColumnHeader>Type</Table.ColumnHeader>
                <Table.ColumnHeader>Description</Table.ColumnHeader>
                <Table.ColumnHeader>Actions</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {features.map((item) => (
                <Table.Row key={item.id}>
                  <Table.Cell>{item.name}</Table.Cell>
                  <Table.Cell>{item.type}</Table.Cell>
                  <Table.Cell>{item.description}</Table.Cell>
                  <Table.Cell>
                    <Flex gap={2}>
                      <IconButton
                        as={Link}
                        to={`/projects/${projectId}/Features/EditFeatureModuleForm?moduleId=${item.id}`}
                        params={{ projectId }}
                        colorScheme="blue"
                        size="sm"
                      >
                        <LuBrush />
                      </IconButton>

                      <IconButton
                        aria-label="Delete module"
                        onClick={() => handleDelete(item.id)}
                        colorScheme="red"
                        size="sm"
                      >
                        <LuTrash />
                      </IconButton>
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
