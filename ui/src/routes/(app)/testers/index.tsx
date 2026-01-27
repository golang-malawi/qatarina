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
import { useTestersQuery, useDeleteTesterMutation } from "@/services/TesterService";
import ErrorAlert from "@/components/ui/error-alert";
import {toaster} from "@/components/ui/toaster"

export const Route = createFileRoute("/(app)/testers/")({
  component: ListTesters,
});

function ListTesters() {
  const { data, isPending, isError, error, refetch } = useTestersQuery();
  const deleteMutation = useDeleteTesterMutation();

  const testers = data?.testers ?? [];

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this tester?")) return;
    
    try {
      await deleteMutation.mutateAsync({
        params: {path: {testerID: String(id)}},
      });
      toaster.success({title: "Tester deleted successfully"});
      refetch();
    }catch (err){
      console.error("Failed to delete tester", err);
      toaster.error({title: "Failed to delete tester"});
    }
  };

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg">Testers</Heading>
        {/* We have to think about this since adding a tester requires a project id which at this level we dont have
        <Link to="/testers/invite">
          <Button colorScheme="teal">+ Add New Tester</Button>
        </Link> */}
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