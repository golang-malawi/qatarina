import { getTestCasesByTestPlanID } from "@/services/TestCaseService";
import { useUsersQuery } from "@/services/UserService";
import { 
  assignTestersToTestPlan, 
  useTestPlanQuery 
} from "@/services/TestPlanService";

import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
  Dialog,
  Portal,
  CloseButton,
  Checkbox,
  CheckboxGroup,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-plans/$testPlanID/test-cases/"
)({
  component: RouteComponent,
});

/* ----------------------- SUB-COMPONENT: ASSIGN DIALOG ----------------------- */

// We create a separate component to handle the "Add Tester" popup logic
// so we can use it multiple times without duplicating code.
function AssignTesterDialog({ 
  users, 
  onAssign, 
  buttonText, 
  buttonVariant = "solid" 
}: { 
  users: any[], 
  onAssign: (selectedIds: string[]) => Promise<void>,
  buttonText: string,
  buttonVariant?: string
}) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    await onAssign(selectedUsers);
    setIsSubmitting(false);
    setSelectedUsers([]);
    setIsDialogOpen(false);
  };

  return (
    <Dialog.Root open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
      <Dialog.Trigger asChild>
        <Button colorScheme="teal" size="sm" variant={buttonVariant}>
          {buttonText}
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Select Testers</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton onClick={() => setSelectedUsers([])} />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body>
              <CheckboxGroup value={selectedUsers} onValueChange={setSelectedUsers}>
                <Stack gap={3} maxH="300px" overflowY="auto">
                  {users.map((user) => (
                    <Checkbox.Root key={user.ID ?? user.id} value={String(user.ID ?? user.id)}>
                      <Checkbox.HiddenInput />
                      <Checkbox.Control />
                      <Checkbox.Label>
                        <Box ml={2}>
                          <Text fontWeight="medium">
                            {user.displayName ?? (`${user.FirstName ?? ""} ${user.LastName ?? ""}`.trim() || user.username)}
                          </Text>
                          <Text fontSize="xs" color="gray.500">{user.Email}</Text>
                        </Box>
                      </Checkbox.Label>
                    </Checkbox.Root>
                  ))}
                </Stack>
              </CheckboxGroup>
              <Button
                mt={5}
                colorScheme="teal"
                width="full"
                loading={isSubmitting}
                isDisabled={selectedUsers.length === 0}
                onClick={handleConfirm}
              >
                Confirm Assignment
              </Button>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

/* ----------------------- MAIN COMPONENT ----------------------- */

function RouteComponent() {
  const { testPlanID } = Route.useParams();
  const usersQuery = useUsersQuery();
  const testPlanQuery = useTestPlanQuery(testPlanID);

  const {
    data: testCases,
    isLoading: isLoadingCases,
    error: errorCases,
    refetch // We need this to update the UI after assigning
  } = useQuery({
    queryKey: ["testCases", testPlanID],
    queryFn: () => getTestCasesByTestPlanID(testPlanID),
  });

  const users = usersQuery.data?.users ?? [];
  const displayData = Array.isArray(testCases) ? testCases : (testCases?.data ?? []);

  const userMap = new Map<number, string>();
  users.forEach((u: any) => {
    const id = u.ID ?? u.id;
    const name = u.displayName ?? (`${u.FirstName ?? ""} ${u.LastName ?? ""}`.trim() || u.username || u.Email || `User ${id}`);
    userMap.set(Number(id), name);
  });

  // Shared function to handle the API call
  const performAssignment = async (selectedUserIds: string[], targetTestCases: any[]) => {
    const testPlan = testPlanQuery.data;
    if (!testPlan || targetTestCases.length === 0) return;

    const plannedTests = targetTestCases.map((tc) => ({
      test_case_id: tc.id,
      user_ids: selectedUserIds.map((id) => Number(id)),
    }));

    const payload = {
      project_id: testPlan.project_id,
      test_plan_id: Number(testPlanID),
      planned_tests: plannedTests,
    };

    try {
      await assignTestersToTestPlan(testPlanID, payload);
      alert("Assigned successfully!");
      refetch(); // Refresh the list to show new badges
    } catch (error) {
      console.error(error);
      alert("Failed to assign.");
    }
  };

  if (isLoadingCases || usersQuery.isLoading) return <Box p={10}>Loading...</Box>;

  return (
    <Box p={4}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading>Tests In this Plan</Heading>
        
        {/* TOP BUTTON: Passes all test cases to the function */}
        <AssignTesterDialog 
          users={users} 
          buttonText="+ Add Tester to All"
          onAssign={(ids) => performAssignment(ids, displayData)} 
        />
      </Flex>

      <Input name="searchTestCase" placeholder="Search for test cases..." mb={6} />

      <Stack gap={4}>
        {displayData.map((run: any) => {
          const assignedNames = run.assigned_tester_ids?.map((id: number) => ({
            id,
            name: userMap.get(id) ?? `User ${id}`,
          })) ?? [];

          return (
            <Box key={run.id} p={4} borderWidth="1px" rounded="md" shadow="sm">
              <Flex justify="space-between" align="flex-start">
                <Box flex="1">
                  <Flex gap={1} wrap="wrap">
                    <Badge><strong>Code:</strong> {run.code ?? "—"}</Badge>
                    <Badge><strong>Module:</strong> {run.feature_or_module ?? "—"}</Badge>
                  </Flex>
                  <Text mt={2}><strong>Title:</strong> {run.title || "—"}</Text>
                </Box>

                {/* INDIVIDUAL BUTTON: Passes ONLY this specific test case to the function */}
                <AssignTesterDialog 
                  users={users} 
                  buttonVariant="solid"
                  buttonText="Assign Tester"
                  onAssign={(ids) => performAssignment(ids, [run])} 
                />
              </Flex>

              <Box mt={3} pt={3} borderTopWidth="1px">
                <Text fontSize="sm" fontWeight="bold" color="gray.600">Assigned:</Text>
                {assignedNames.length ? (
                  <Flex gap={2} mt={1} wrap="wrap">
                    {assignedNames.map((t: any) => (
                      <Badge key={`${run.id}-${t.id}`} colorScheme="purple" variant="subtle">
                        {t.name}
                      </Badge>
                    ))}
                  </Flex>
                ) : (
                  <Text fontSize="xs" color="gray.400">None assigned</Text>
                )}
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}