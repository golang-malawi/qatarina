import { getTestCasesByTestPlanID } from "@/services/TestCaseService";
import { useUsersQuery } from "@/services/UserService";
import {
  assignTestersToTestPlan,
  useTestPlanQuery,
} from "@/services/TestPlanService";
import {
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  CheckboxGroup,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  Separator,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { IconSearch, IconUserPlus, IconUsers } from "@tabler/icons-react";
import { type ElementType, useMemo, useState } from "react";
import { AppDialog } from "@/components/ui/app-dialog";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/page-states";
import { toaster } from "@/components/ui/toaster";
import type { components } from "@/lib/api/v1";

type TestCaseItem = components["schemas"]["schema.TestCaseResponse"] & {
  assigned_tester_ids?: number[];
};
type TestPlanItem = components["schemas"]["schema.TestPlanResponseItem"];

type UserRecord = {
  ID?: number;
  id?: number;
  FirstName?: string;
  LastName?: string;
  displayName?: string;
  username?: string;
  Email?: string;
  email?: string;
};

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-plans/$testPlanID/test-cases/"
)({
  component: TestPlanTestCasesPage,
});

function TestPlanTestCasesPage() {
  const { testPlanID } = Route.useParams();
  const [searchTerm, setSearchTerm] = useState("");

  const usersQuery = useUsersQuery();
  const testPlanQuery = useTestPlanQuery(testPlanID) as {
    data: TestPlanItem | undefined;
    isLoading: boolean;
    error: unknown;
  };

  const {
    data: testCasesResult,
    isLoading: isLoadingCases,
    error: testCasesError,
    refetch,
  } = useQuery({
    queryKey: ["testCases", testPlanID],
    queryFn: () => getTestCasesByTestPlanID(Number(testPlanID)),
  });

  const users = useMemo(
    () => (usersQuery.data?.users ?? []) as UserRecord[],
    [usersQuery.data?.users]
  );
  const allCases = useMemo(() => normalizeTestCases(testCasesResult), [testCasesResult]);

  const filteredCases = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return allCases;

    return allCases.filter((testCase) => {
      const searchable = [
        testCase.id,
        testCase.code,
        testCase.title,
        testCase.feature_or_module,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(term);
    });
  }, [allCases, searchTerm]);

  const userMap = useMemo(() => {
    const mapped = new Map<number, string>();
    users.forEach((user) => {
      const id = Number(user.ID ?? user.id);
      if (Number.isNaN(id)) return;
      mapped.set(id, getUserLabel(user, id));
    });
    return mapped;
  }, [users]);

  const assignedCases = allCases.filter(
    (testCase) => (testCase.assigned_tester_ids?.length ?? 0) > 0
  ).length;
  const unassignedCases = allCases.length - assignedCases;

  const performAssignment = async (
    selectedUserIds: string[],
    targetTestCases: TestCaseItem[]
  ) => {
    const projectId = testPlanQuery.data?.project_id;
    if (!projectId) {
      toaster.error({ title: "Unable to resolve project for this test plan" });
      return;
    }

    const plannedTests = targetTestCases
      .filter((testCase) => Boolean(testCase.id))
      .map((testCase) => ({
        test_case_id: testCase.id,
        user_ids: selectedUserIds.map((id) => Number(id)),
      }));

    if (plannedTests.length === 0) {
      toaster.error({ title: "No test cases available for assignment" });
      return;
    }

    try {
      await assignTestersToTestPlan(testPlanID, {
        project_id: projectId,
        test_plan_id: Number(testPlanID),
        planned_tests: plannedTests,
      });
      toaster.success({ title: "Tester assignments saved" });
      await refetch();
    } catch (assignError) {
      console.error("Failed to assign testers", assignError);
      toaster.error({ title: "Failed to assign testers" });
    }
  };

  if (isLoadingCases || usersQuery.isLoading || testPlanQuery.isLoading) {
    return <LoadingState label="Loading test cases..." />;
  }
  if (testCasesError || testPlanQuery.error) {
    return <ErrorState title="Error loading test cases for this plan" />;
  }

  return (
    <Box w="full">
      <Card.Root border="sm" borderColor="border.subtle" bg="bg.surface" mb={5}>
        <Card.Body p={{ base: 4, md: 6 }}>
          <Flex
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            align={{ base: "start", md: "center" }}
            gap={4}
          >
            <Stack gap={1}>
              <HStack gap={2}>
                <Icon as={IconUsers} color="brand.solid" />
                <Heading size="lg" color="fg.heading">
                  Test Cases in Plan
                </Heading>
              </HStack>
              <Text color="fg.subtle">
                Assign testers to each case and keep coverage balanced across
                the execution window.
              </Text>
              <HStack gap={2} flexWrap="wrap">
                <Badge colorPalette="brand" variant="subtle">
                  {allCases.length} total
                </Badge>
                <Badge colorPalette="green" variant="subtle">
                  {assignedCases} assigned
                </Badge>
                <Badge colorPalette="orange" variant="subtle">
                  {unassignedCases} unassigned
                </Badge>
              </HStack>
            </Stack>

            <AssignTesterDialog
              users={users}
              buttonText="Assign to visible cases"
              buttonIcon={IconUserPlus}
              onAssign={(ids) => performAssignment(ids, filteredCases)}
              disabled={filteredCases.length === 0}
            />
          </Flex>
        </Card.Body>
      </Card.Root>

      <Card.Root border="sm" borderColor="border.subtle" bg="bg.surface" mb={5}>
        <Card.Body p={4}>
          <InputGroup startElement={<IconSearch size={16} />}>
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by code, title, module, or id"
            />
          </InputGroup>
        </Card.Body>
      </Card.Root>

      {allCases.length === 0 ? (
        <EmptyState
          title="No test cases in this plan yet"
          description="Add test cases to this plan first, then assign testers."
        />
      ) : filteredCases.length === 0 ? (
        <EmptyState
          title="No matching test cases"
          description="Try a different search term to find the case you need."
        />
      ) : (
        <Stack gap={4}>
          {filteredCases.map((testCase, index) => {
            const assignedNames =
              testCase.assigned_tester_ids?.map((id) => ({
                id,
                name: userMap.get(id) ?? `User ${id}`,
              })) ?? [];
            const title = testCase.title?.trim() || `Test Case ${index + 1}`;

            return (
              <Card.Root
                key={testCase.id ?? `${title}-${index}`}
                border="sm"
                borderColor="border.subtle"
                bg="bg.surface"
                shadow="sm"
              >
                <Card.Body p={5}>
                  <Stack gap={4}>
                    <Flex
                      justify="space-between"
                      align={{ base: "start", md: "center" }}
                      direction={{ base: "column", md: "row" }}
                      gap={3}
                    >
                      <Stack gap={1}>
                        <Heading size="md" color="fg.heading">
                          {title}
                        </Heading>
                        <HStack gap={2} flexWrap="wrap">
                          {testCase.code && (
                            <Badge colorPalette="blue" variant="outline">
                              Code: {testCase.code}
                            </Badge>
                          )}
                          {testCase.feature_or_module && (
                            <Badge colorPalette="purple" variant="outline">
                              Module: {testCase.feature_or_module}
                            </Badge>
                          )}
                          {testCase.id && (
                            <Badge colorPalette="gray" variant="outline">
                              ID: {testCase.id}
                            </Badge>
                          )}
                        </HStack>
                      </Stack>

                      <AssignTesterDialog
                        users={users}
                        buttonText="Assign Tester"
                        buttonVariant="outline"
                        buttonIcon={IconUserPlus}
                        onAssign={(ids) => performAssignment(ids, [testCase])}
                      />
                    </Flex>

                    <Separator />

                    <Grid
                      templateColumns={{
                        base: "1fr",
                        md: "minmax(0, 1fr) minmax(0, 2fr)",
                      }}
                      gap={4}
                    >
                      <Box>
                        <Text fontSize="xs" color="fg.subtle" mb={1}>
                          Assignment Status
                        </Text>
                        <Badge
                          colorPalette={assignedNames.length > 0 ? "green" : "orange"}
                          variant="subtle"
                        >
                          {assignedNames.length > 0
                            ? `${assignedNames.length} tester(s) assigned`
                            : "Unassigned"}
                        </Badge>
                      </Box>

                      <Box>
                        <Text fontSize="xs" color="fg.subtle" mb={1}>
                          Assigned Testers
                        </Text>
                        {assignedNames.length > 0 ? (
                          <HStack gap={2} flexWrap="wrap">
                            {assignedNames.map((tester) => (
                              <Badge
                                key={`${testCase.id ?? "case"}-${tester.id}`}
                                colorPalette="brand"
                                variant="subtle"
                              >
                                {tester.name}
                              </Badge>
                            ))}
                          </HStack>
                        ) : (
                          <Text color="fg.subtle" fontSize="sm">
                            No testers assigned.
                          </Text>
                        )}
                      </Box>
                    </Grid>
                  </Stack>
                </Card.Body>
              </Card.Root>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}

function AssignTesterDialog({
  users,
  onAssign,
  buttonText,
  buttonVariant = "solid",
  buttonIcon,
  disabled = false,
}: {
  users: UserRecord[];
  onAssign: (selectedIds: string[]) => Promise<void>;
  buttonText: string;
  buttonVariant?:
    | "solid"
    | "subtle"
    | "surface"
    | "outline"
    | "ghost"
    | "plain";
  buttonIcon?: ElementType;
  disabled?: boolean;
}) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (selectedUsers.length === 0) return;
    try {
      setIsSubmitting(true);
      await onAssign(selectedUsers);
      setSelectedUsers([]);
      setIsDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppDialog
      open={isDialogOpen}
      onOpenChange={(event) => {
        setIsDialogOpen(event.open);
        if (!event.open) setSelectedUsers([]);
      }}
      title="Select testers"
      showCloseTrigger
      onClose={() => setSelectedUsers([])}
      trigger={
        <Button
          colorPalette="brand"
          size="sm"
          variant={buttonVariant}
          disabled={disabled}
        >
          {buttonIcon && <Icon as={buttonIcon} />}
          {buttonText}
        </Button>
      }
      footer={
        <Button
          colorPalette="brand"
          loading={isSubmitting}
          disabled={selectedUsers.length === 0 || users.length === 0}
          onClick={handleConfirm}
        >
          Confirm Assignment
        </Button>
      }
    >
      {users.length === 0 ? (
        <Text color="fg.subtle" fontSize="sm">
          No users available to assign.
        </Text>
      ) : (
        <CheckboxGroup value={selectedUsers} onValueChange={setSelectedUsers}>
          <Stack gap={3} maxH="72" overflowY="auto">
            {users.map((user) => {
              const userId = String(user.ID ?? user.id ?? "");
              if (!userId) return null;

              return (
                <Checkbox.Root key={userId} value={userId}>
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                  <Checkbox.Label>
                    <Box ml={2}>
                      <Text fontWeight="medium">
                        {getUserLabel(user, Number(userId))}
                      </Text>
                      <Text fontSize="xs" color="fg.subtle">
                        {user.Email ?? user.email ?? "No email"}
                      </Text>
                    </Box>
                  </Checkbox.Label>
                </Checkbox.Root>
              );
            })}
          </Stack>
        </CheckboxGroup>
      )}
    </AppDialog>
  );
}

function normalizeTestCases(payload: unknown): TestCaseItem[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as TestCaseItem[];

  const payloadObject = payload as {
    data?: unknown;
    test_cases?: unknown;
  };

  if (Array.isArray(payloadObject.test_cases)) {
    return payloadObject.test_cases as TestCaseItem[];
  }

  if (payloadObject.data && typeof payloadObject.data === "object") {
    const nestedData = payloadObject.data as { test_cases?: unknown };
    if (Array.isArray(nestedData.test_cases)) {
      return nestedData.test_cases as TestCaseItem[];
    }

    if (Array.isArray(payloadObject.data)) {
      return payloadObject.data as TestCaseItem[];
    }
  }

  return [];
}

function getUserLabel(user: UserRecord, fallbackId: number) {
  const fullName = `${user.FirstName ?? ""} ${user.LastName ?? ""}`.trim();
  return (
    user.displayName ||
    fullName ||
    user.username ||
    user.Email ||
    user.email ||
    `User ${fallbackId}`
  );
}
