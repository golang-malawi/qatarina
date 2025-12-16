import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Spinner,
  Stack,
  Table,
  Text,
  CloseButton,
  Dialog,
  Portal,
  Checkbox,
  CheckboxGroup,
} from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import { LuPencil, LuTrash } from "react-icons/lu";
import {
  useTestPlanQuery,
  assignTestersToTestPlan,
} from "@/services/TestPlanService";
import { useUsersQuery, useGetUserQuery } from "@/services/UserService";
import ErrorAlert from "@/components/ui/error-alert";
import { useState } from "react";

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
  username?: string;
};

/* ----------------------- COMPONENT ----------------------- */

function TestPlanTesters() {
  const { testPlanID } = Route.useParams();

  /* ----------------------- DATA FETCHING ----------------------- */

  const usersQuery = useUsersQuery();
  const testPlanQuery = useTestPlanQuery(testPlanID);

  const assignedToID: number | undefined = testPlanQuery.data?.assigned_to_id;

  const assignedUserQuery = useGetUserQuery(assignedToID?.toString(), {
    enabled: assignedToID !== undefined,
  });

  /* ----------------------- LOCAL STATE ----------------------- */

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  /* ----------------------- LOADING / ERROR STATES ----------------------- */

  if (usersQuery.isPending || testPlanQuery.isLoading) {
    return (
      <Flex justify="center" align="center" h="full" p={10}>
        <Spinner size="xl" color="teal.500" />
      </Flex>
    );
  }

  if (usersQuery.isError) {
    return <ErrorAlert message="Failed to load users." />;
  }

  if (testPlanQuery.isError) {
    return (
      <Text color="red.500" p={6}>
        Failed to load test plan.
      </Text>
    );
  }

  /* ----------------------- DATA NORMALIZATION ----------------------- */

  const users: UserApi[] =
    usersQuery.data?.users
      ?.filter((u: any) => u.ID || u.id)
      .map((u: any) => ({
        ID: u.ID ?? u.id,
        FirstName: u.FirstName ?? "",
        LastName: u.LastName ?? "",
        Email: u.Email ?? u.username ?? "",
        displayName: u.displayName,
        username: u.username,
      })) ?? [];

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

  const unassignedUsers = users.filter((user) => user.ID !== assignedToID);

  /* ----------------------- HANDLERS ----------------------- */

  const handleDelete = (id: string) => {
    if (!window.confirm("Are you sure you want to remove this tester?")) return;
    console.log("Remove tester:", id);
  };

  const handleEdit = (id: string) => {
    console.log("Edit tester:", id);
  };

const handleAssignSelected = async () => {
  if (selectedUsers.length === 0) return;

  const testPlan = testPlanQuery.data;
  if (!testPlan) {
    alert("Test plan data not loaded yet.");
    return;
  }

  const projectId = testPlan.project_id;
  const testPlanId = Number(testPlanID);
  const testCases = testPlan.test_cases ?? [];

  if (!projectId || !testPlanId) {
    alert("Invalid project or test plan ID.");
    return;
  }

  if (testCases.length === 0) {
    alert("This test plan has no test cases.");
    return;
  }

  const plannedTests = testCases.map((testCase) => ({
    test_case_id: testCase.id,
    user_ids: selectedUsers.map((id) => Number(id)),
  }));

  const payload = {
    project_id: projectId,
    test_plan_id: testPlanId,
    planned_tests: plannedTests,
  };

  try {
    await assignTestersToTestPlan(testPlanID, payload);

    setSelectedUsers([]);
    setIsDialogOpen(false);
    alert("Testers assigned successfully!");
  } catch (error) {
    console.error("Assign testers failed:", error);
    alert("Failed to assign testers.");
  }
};


  /* ----------------------- UI ----------------------- */

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg">Testers Assigned to this Plan</Heading>

        <Dialog.Root
          size="cover"
          placement="center"
          motionPreset="slide-in-bottom"
          
          open={isDialogOpen}
          onOpenChange={(e) => setIsDialogOpen(e.open)}
        >
          <Dialog.Trigger asChild>
            <Button colorScheme="teal" size="sm">
              + Add New Tester
            </Button>
          </Dialog.Trigger>

          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content>
                <Dialog.Header>
                  <Dialog.Title>Add Tester</Dialog.Title>
                  <Dialog.CloseTrigger asChild>
                    <CloseButton
                      size="sm"
                      onClick={() => setSelectedUsers([])}
                    />
                  </Dialog.CloseTrigger>
                </Dialog.Header>

                <Dialog.Body>
                  {unassignedUsers.length === 0 && (
                    <Text color="gray.500">No unassigned users available.</Text>
                  )}

                  <CheckboxGroup
                    value={selectedUsers}
                    onValueChange={setSelectedUsers}
                  >
                    <Stack gap={3}>
                      {unassignedUsers.map((user) => (
                        <Checkbox.Root key={user.ID} value={String(user.ID)}>
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label>
                            <Flex
                              direction="column"
                              p={3}
                              borderWidth="1px"
                              borderRadius="md"
                            >
                              <Text fontWeight="medium">
                                {user.displayName ||
                                  `${user.FirstName} ${user.LastName}`.trim()}
                              </Text>
                              <Text fontSize="sm" color="gray.500">
                                {user.username || user.Email}
                              </Text>
                            </Flex>
                          </Checkbox.Label>
                        </Checkbox.Root>
                      ))}
                    </Stack>
                  </CheckboxGroup>

                  <Button
                    mt={5}
                    colorScheme="teal"
                    isFullWidth
                    isDisabled={selectedUsers.length === 0}
                    onClick={handleAssignSelected}
                  >
                    Assign Selected Testers ({selectedUsers.length})
                  </Button>
                </Dialog.Body>

                <Dialog.Footer>
                  <Dialog.ActionTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </Dialog.ActionTrigger>
                </Dialog.Footer>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      </Flex>

      <Text mb={4} color="gray.600">
        Total Testers: <strong>{testers.length}</strong>
      </Text>

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
                    size="sm"
                    onClick={() => handleEdit(tester.id)}
                  >
                    <LuPencil />
                  </IconButton>

                  <IconButton
                    aria-label="Delete tester"
                    size="sm"
                    colorScheme="red"
                    onClick={() => handleDelete(tester.id)}
                  >
                    <LuTrash />
                  </IconButton>
                </Flex>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
