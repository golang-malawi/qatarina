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
  // ADDED: Import Checkbox components for multi-select
  Checkbox,
  CheckboxGroup,
} from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import { LuPencil, LuTrash } from "react-icons/lu";
import { useTestPlanQuery } from "@/services/TestPlanService";
import { useUsersQuery, useGetUserQuery } from "@/services/UserService";
import ErrorAlert from "@/components/ui/error-alert";
// ADDED: Import useState for managing selected users
import { useState } from "react";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-plans/$testPlanID/testers/"
)({
  component: RouteComponent,
});

type Tester = {
  id: string;
  name: string;
  email: string;
  role: string;
};

function RouteComponent() {
  const { testPlanID } = Route.useParams();
  const usersQuery = useUsersQuery();

  // 1. STATE: State to store the IDs of the users selected via checkboxes
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  // 2. STATE: State to control the Dialog open/close
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const testPlanQuery = useTestPlanQuery(testPlanID) as {
    data: any | null;
    isLoading: boolean;
    error: unknown;
  };

  const assignedToID = testPlanQuery.data?.AssignedToID;

  const assignedUserQuery = useGetUserQuery(assignedToID ?? "", {
    enabled: !!assignedToID,
  });

  /* ----------------------- RENDER STATES ----------------------- */

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

  if (testPlanQuery.error) {
    return (
      <Text color="red.500" p={6}>
        Failed to load test plan.
      </Text>
    );
  }

  /* ----------------------- DATA MAPPING ----------------------- */

  const testers: Tester[] =
    testPlanQuery.data && assignedUserQuery.data
      ? [
          {
            id: assignedUserQuery.data.ID.toString(),
            name: `${assignedUserQuery.data.FirstName} ${assignedUserQuery.data.LastName}`,
            email: assignedUserQuery.data.Email,
            role: "Assigned Tester",
          },
        ]
      : [];

  const users = usersQuery.data?.users ?? [];
  // Filter out users already assigned
  const unassignedUsers = users.filter(
    (user: any) => user.id !== assignedUserQuery.data?.ID?.toString()
  );

  /* ----------------------- HANDLERS ----------------------- */

  const handleDelete = (id: string) => {
    if (!window.confirm("Are you sure you want to remove this tester?")) return;
    console.log("Delete tester", id);
  };

  const handleEdit = (id: string) => {
    console.log("Edit tester", id);
  };

  // HANDLER: Assigns the users currently in the selectedUsers state
  const handleAssignSelected = () => {
    if (selectedUsers.length === 0) {
      alert("Please select at least one user to assign.");
      return;
    }
    console.log("Assigning users with IDs:", selectedUsers);
    // TODO: call assign-tester mutation here, using the selectedUsers array

    // Reset selection and close dialog after successful assignment
    setSelectedUsers([]);
    setIsDialogOpen(false); // Close the dialog
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
          // Use the controlled state
          open={isDialogOpen}
          onOpenChange={(e) => setIsDialogOpen(e.open)} // Corrected type from reference
        >
          <Dialog.Trigger asChild>
            <Button variant="outline" colorScheme="teal" size="sm">
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
                    {/* Reset selection when closing the dialog */}
                    <CloseButton size="sm" onClick={() => setSelectedUsers([])} />
                  </Dialog.CloseTrigger>
                </Dialog.Header>

                <Dialog.Body>
                  {usersQuery.isPending && (
                    <Flex justify="center" py={6}>
                      <Spinner />
                    </Flex>
                  )}

                  {usersQuery.isError && (
                    <ErrorAlert message="Failed to load users." />
                  )}

                  {!usersQuery.isPending && unassignedUsers.length === 0 && (
                    <Text color="gray.500">No unassigned users available.</Text>
                  )}

                  {/* 3. CHECKBOX GROUP: Use CheckboxGroup for multi-selection logic */}
                  <CheckboxGroup
                    colorScheme="teal"
                    value={selectedUsers}
                    // onValueChange is the correct handler for the composite CheckboxGroup
                    onValueChange={setSelectedUsers} 
                  >
                    <Stack gap={3}>
                      {unassignedUsers.map((user: any) => (
                        // Use Checkbox.Root as the container for the user item
                        <Checkbox.Root
                          key={user.id}
                          value={user.id.toString()} // Value is the user ID
                        >
                          {/* Required Ark-style sub-components */}
                          <Checkbox.HiddenInput /> 
                          <Checkbox.Control /> 
                          
                          <Flex
                            justify="space-between"
                            align="center"
                            p={3}
                            borderWidth="1px"
                            borderRadius="md"
                            ml={4} 
                          >
                            <Box>
                              <Checkbox.Label>
                                <Text fontWeight="medium">{user.displayName}</Text>
                                <Text fontSize="sm" color="gray.500">
                                  {user.username}
                                </Text>
                              </Checkbox.Label>
                            </Box>
                          </Flex>
                        </Checkbox.Root>
                      ))}
                    </Stack>
                  </CheckboxGroup>

                  {/* 5. ACTION BUTTON: Single button to assign all selected */}
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
                
                {/* 6. Dialog Footer for action buttons */}
                <Dialog.Footer>
                    <Dialog.ActionTrigger asChild>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    </Dialog.ActionTrigger>
                    <Button variant="ghost" onClick={handleAssignSelected} isDisabled={selectedUsers.length === 0}>Assign Testers</Button>
                </Dialog.Footer>

              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      </Flex>

      <Text mb={4} color="gray.600">
        Total Testers: <strong>{testers.length}</strong>
      </Text>

      <Stack gap="6">
        {/* Table components are assumed to also use the composite structure, 
            so we leave them as Table.Root, Table.Header, etc.
            If you get the 'Element type is invalid' error again, 
            it means your Table component is NOT the composite one.
        */}
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
                    >
                      <LuPencil />
                    </IconButton>

                    <IconButton
                      aria-label="Delete tester"
                      onClick={() => handleDelete(tester.id)}
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
    </Box>
  );
}