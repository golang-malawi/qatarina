import { Box, Stack, Table, Heading, Button, Flex } from "@chakra-ui/react";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/Features/"
)({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const projectId = params.projectId;

  const features = [
    {
      id: 1,
      name: "Login Module",
      type: "module",
      description: "Handles authentication",
    },
    {
      id: 2,
      name: "Dashboard",
      type: "feature",
      description: "Displays analytics and KPIs",
    },
    {
      id: 3,
      name: "Sidebar",
      type: "component",
      description: "Navigation for sections",
    },
    {
      id: 4,
      name: "Notifications",
      type: "feature",
      description: "Real-time alerts",
    },
    {
      id: 5,
      name: "Profile Card",
      type: "component",
      description: "Shows user info",
    },
  ];

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

      <Stack gap="6">
        <Table.Root size="md" variant="striped">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Name</Table.ColumnHeader>
              <Table.ColumnHeader>Type</Table.ColumnHeader>
              <Table.ColumnHeader>Description</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {features.map((item) => (
              <Table.Row key={item.id}>
                <Table.Cell>{item.name}</Table.Cell>
                <Table.Cell>{item.type}</Table.Cell>
                <Table.Cell>{item.description}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Stack>
    </Box>
  );
}
