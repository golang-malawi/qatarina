import { 
  Box, 
  Heading, 
  Table, 
  Button, 
  Flex 
} from "@chakra-ui/react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toaster } from "@/components/ui/toaster";
import $api from "@/lib/api/query";

export const Route = createFileRoute("/(app)/orgs/")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData($api.queryOptions("get", "/v1/orgs")),
  component: OrgsPage,
});

function OrgsPage() {
  const queryClient = useQueryClient();
  const orgsQueryOptions = $api.queryOptions("get", "/v1/orgs");
  const { data: { orgs = [] } = {} } = $api.useQuery("get", "/v1/orgs");
  const deleteMutation = $api.useMutation("delete", "/v1/orgs/{orgID}");

  const handleDelete = (orgID: number, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(
        { params: { path: { orgID: orgID.toString() } } },
        {
          onSuccess: () => {
            toaster.create({
              title: "Success",
              description: `Organization "${name}" deleted successfully`,
              type: "success",
            });
            queryClient.setQueryData(orgsQueryOptions.queryKey, (oldData: any) => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                orgs: oldData.orgs.filter((o: any) => o.id !== orgID),
              };
            });
            queryClient.invalidateQueries({ queryKey: orgsQueryOptions.queryKey });
          },
          onError: (error: any) => {
            toaster.create({
              title: "Error",
              description: `Failed to delete organization: ${error.message}`,
              type: "error",
            });
          },
        }
      );
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="3xl">Organizations</Heading>
        <Link to="/orgs/new">
          <Button bg="black" color="white">
            + Create Organization
          </Button>
        </Link>
      </Flex>

      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Name</Table.ColumnHeader>
            <Table.ColumnHeader>Country</Table.ColumnHeader>
            <Table.ColumnHeader>Website</Table.ColumnHeader>
            <Table.ColumnHeader>Created At</Table.ColumnHeader>
            <Table.ColumnHeader>Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {(orgs ?? []).map((org: any) => (
            <Table.Row key={org.id}>
              <Table.Cell>{org.name}</Table.Cell>
              <Table.Cell>{org.country}</Table.Cell>
              <Table.Cell>
                {org.website_url ? (
                  <a href={org.website_url} target="_blank" rel="noopener noreferrer">
                    {org.website_url}
                  </a>
                ) : "N/A"}
              </Table.Cell>
              <Table.Cell>{new Date(org.created_at).toLocaleDateString()}</Table.Cell>
              <Table.Cell>
                <Flex gap={2}>
                  <Link to="/orgs/$id" params={{ id: org.id.toString() }}>
                    <Button size="sm" bg="black" color="white">View</Button>
                  </Link>
                  <Link to="/orgs/$id/edit" params={{ id: org.id.toString() }}>
                    <Button size="sm" bg="black" color="white">Edit</Button>
                  </Link>
                  <Button
                    size="sm"
                    bg="black"
                    color="white"
                    loading={deleteMutation.isPending}
                    onClick={() => handleDelete(org.id, org.name)}
                  >
                    Delete
                  </Button>
                </Flex>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}