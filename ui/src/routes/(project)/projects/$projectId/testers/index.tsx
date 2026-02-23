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
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LuPencil, LuTrash } from "react-icons/lu";
import {useProjectTestersQuery, useDeleteTesterMutation} from "@/services/TesterService";
import { toaster } from "@/components/ui/toaster";

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
  const navigate = useNavigate();

  const {data, isPending, isError, error, refetch} = useProjectTestersQuery(projectID);
  const deleteMutation = useDeleteTesterMutation();

  if (isPending) {
    return(
      <Flex justify="center" py={10}>
        <Spinner size="lg" color="brand.solid" />
      </Flex>
    );
  }

  if (isError) {
    return(
      <Text color="fg.error">
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

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this tester?")) return;
    
    try {
      await deleteMutation.mutateAsync({
        params: {path: {testerID: id}}
      });
      toaster.success({title: "Tester removed successfully"});
      refetch();
    } catch (err){
      console.error("Failed to delete tester", err);
      toaster.error({title: "Failed to remove tester"})
    }
  };

  const handleEdit = (id: string) => {
    navigate({
      to: "/projects/$projectId/testers/edit/$testerId",
      params: {projectId, testerId:id},
    })
  };

  return (
    <Box p={6}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg" color="fg.heading">
          Project Testers
        </Heading>
        <Button colorPalette="brand"
        onClick={() =>
          navigate({
            to: "/projects/$projectId/testers/new",
            params: {projectId},
          })
        }
      >
        + Add New Tester
        </Button>
      </Flex>

      {/* Total Testers */}
      <Text mb={4} color="fg.muted">
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
                        colorPalette="info"
                        size="sm"
                        children={<LuPencil />}
                      />
                      <IconButton
                        aria-label="Delete tester"
                        onClick={() => handleDelete(tester.id)}
                        colorPalette="danger"
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
