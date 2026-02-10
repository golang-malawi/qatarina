import {
  Box,
  Flex,
  Heading,
  IconButton,
  Spinner,
  Table,
  Text,
} from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import { LuPencil, LuTrash } from "react-icons/lu";
import { useTestPlanQuery } from "@/services/TestPlanService";
import { useGetUserQuery } from "@/services/UserService";
import ErrorAlert from "@/components/ui/error-alert";

/* ----------------------- ROUTE ----------------------- */

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-plans/$testPlanID/testers/"
)({
  component: TestPlanTesters,
});

/* ----------------------- TYPES ----------------------- */

type Tester = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type UserApi = {
  ID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  displayName?: string;
};

/* ----------------------- COMPONENT ----------------------- */

function TestPlanTesters() {
  const { testPlanID } = Route.useParams();

  /* ----------------------- DATA FETCHING ----------------------- */

  const testPlanQuery = useTestPlanQuery(testPlanID);
  const assignedToID: number | undefined = testPlanQuery.data?.assigned_to_id;

  // We only fetch the specific user assigned to this test plan
  const assignedUserQuery = useGetUserQuery(
    assignedToID ? (assignedToID as any).toString() : undefined
  );

  /* ----------------------- LOADING / ERROR STATES ----------------------- */

  if (
    testPlanQuery.isLoading ||
    (assignedToID && assignedUserQuery.isLoading)
  ) {
    return (
      <Flex justify="center" align="center" h="full" p={10}>
        <Spinner size="xl" color="brand.solid" />
      </Flex>
    );
  }

  if (testPlanQuery.isError) {
    return <ErrorAlert message="Failed to load test plan." />;
  }

  /* ----------------------- DATA NORMALIZATION ----------------------- */

  const assignedUser = assignedUserQuery.data as UserApi | undefined;

  const testers: Tester[] = assignedUser
    ? [
        {
          id: String(assignedUser.ID),
          name:
            assignedUser.displayName ??
            `${assignedUser.FirstName} ${assignedUser.LastName}`.trim(),
          email: assignedUser.Email,
          role: "Assigned Tester",
        },
      ]
    : [];

  /* ----------------------- HANDLERS ----------------------- */

  const handleDelete = (id: string) => {
    if (!window.confirm("Are you sure you want to remove this tester?")) return;
    console.log("Remove tester:", id);
  };

  const handleEdit = (id: string) => {
    console.log("Edit tester:", id);
  };

  /* ----------------------- UI ----------------------- */

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg" color="fg.heading">
          Testers Assigned to this Plan
        </Heading>
      </Flex>

      <Text mb={4} color="fg.muted">
        Total Testers: <strong>{testers.length}</strong>
      </Text>

      <Table.Root size="md" variant="line">
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
          {testers.length > 0 ? (
            testers.map((tester) => (
              <Table.Row key={tester.id}>
                <Table.Cell>{tester.id}</Table.Cell>
                <Table.Cell fontWeight="medium">{tester.name}</Table.Cell>
                <Table.Cell>{tester.email}</Table.Cell>
                <Table.Cell>{tester.role}</Table.Cell>
                <Table.Cell>
                  <Flex gap={2}>
                    <IconButton
                      aria-label="Edit tester"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(tester.id)}
                    >
                      <LuPencil />
                    </IconButton>

                    <IconButton
                      aria-label="Delete tester"
                      variant="ghost"
                      size="sm"
                      colorPalette="danger"
                      onClick={() => handleDelete(tester.id)}
                    >
                      <LuTrash />
                    </IconButton>
                  </Flex>
                </Table.Cell>
              </Table.Row>
            ))
          ) : (
            <Table.Row>
              <Table.Cell
                colSpan={5}
                textAlign="center"
                py={10}
                color="fg.subtle"
              >
                No testers assigned to this plan yet.
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
