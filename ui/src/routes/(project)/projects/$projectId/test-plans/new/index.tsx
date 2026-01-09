import { createFileRoute } from "@tanstack/react-router";
import {
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Dialog,
  Fieldset,
  Flex,
  For,
  Heading,
  Portal,
} from "@chakra-ui/react";
import { Toaster, toaster } from "@/components/ui/toaster"
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { SelectAssignedTestCase, CreateTestPlan } from "@/common/models";
import { useCreateTestPlanMutation } from "@/services/TestPlanService";
import { useTestersQuery } from "@/services/TesterService";
import { testCasesByProjectIdQueryOptions } from "@/data/queries/test-cases";
import { DynamicForm } from "@/components/form/DynamicForm";
import { testPlanCreationSchema } from "@/data/forms/test-plan-schemas";
import { testPlanCreationFields } from "@/data/forms/test-plan-field-configs";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-plans/new/"
)({
  loader: ({ context: { queryClient }, params: { projectId } }) =>
    queryClient.ensureQueryData(testCasesByProjectIdQueryOptions(projectId)),
  component: CreateNewTestPlan,
});

type CreateTestPlanForm = Omit<CreateTestPlan, "project_id">;

function CreateNewTestPlan() {
  const createTestPlanMutation = useCreateTestPlanMutation();
  const testersQuery = useTestersQuery();
  const redirect = useNavigate();
  const { projectId } = Route.useParams();

  const [selectedTestCases, setSelectedTestCases] = useState<
    SelectAssignedTestCase[]
  >([]);

  const [activeTestCaseId, setActiveTestCaseId] = useState<string | null>(null);

  const activeTestCase = selectedTestCases.find(
    (t) => t.test_case_id === activeTestCaseId
  );
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkSelectedTesters, setBulkSelectedTesters] = useState<string[]>([]);
  const {
    data: testCases,
    isPending,
    error,
  } = useSuspenseQuery(testCasesByProjectIdQueryOptions(projectId));

  if (isPending) {
    return "Loading Test Cases...";
  }

  if (error) {
    return <div className="error">Error: error fetching test cases</div>;
  }

  const testers = testersQuery.data?.testers ?? [];

 async function handleSubmit(data: CreateTestPlanForm) {
  const { isValid, unassigned } =
    validateTestCaseAssignments(selectedTestCases);

  if (!isValid) {
    toaster.create({
      title: "Missing tester assignments",
      description: `You have ${unassigned.length} test case(s) without assigned testers.`,
      type: "error",
      duration: 4000,
    });

    return;
  }

  const res = await createTestPlanMutation.mutateAsync({
    body: {
      project_id: parseInt(projectId!),
      assigned_to_id: data.assigned_to_id,
      kind: data.kind,
      description: data.description,
      start_at: data.start_at,
      closed_at: data.closed_at,
      scheduled_end_at: data.scheduled_end_at,
      planned_tests: selectedTestCases.map((tc) => ({
        test_case_id: tc.test_case_id,
        user_ids: tc.user_ids.map(Number),
      })),
    },
  });

  if (res) {
    toaster.create({
      title: "Test Plan created",
      type: "success",
    });

    redirect({
      to: "/projects/$projectId/test-plans",
      params: { projectId },
    });
  }
}


  function openAssignModal(testCaseId: number) {
    const exists = selectedTestCases.some((t) => t.test_case_id === testCaseId.toString());

    if (!exists) {
    toaster.create({
      title: "Test Case not selected",
      description: "Please select the test case before assigning testers.",
      type: "error",
    });
      return;
    }

    setActiveTestCaseId(testCaseId.toString());
  }

  function validateTestCaseAssignments(
    selectedTestCases: SelectAssignedTestCase[]
  ) {
    const unassigned = selectedTestCases.filter(
      (tc) => tc.user_ids.length === 0
    );

    return {
      isValid: unassigned.length === 0,
      unassigned,
    };
  }
  

  return (
    <div>
      <Toaster
      />
      <Box>
        <Heading>Create a Test Plan</Heading>
        <DynamicForm
          schema={testPlanCreationSchema}
          fields={testPlanCreationFields}
          onSubmit={handleSubmit}
          submitText="Create Plan"
          layout="vertical"
          spacing={4}
        />
        <Heading>Select & Assign Test Cases</Heading>
        <Flex
          mb={4}
          p={3}
          borderWidth="1px"
          borderRadius="md"
          align="center"
          justify="space-between"
        >
          <Box fontSize="sm">
            <strong>{selectedTestCases.length}</strong> test case
            {selectedTestCases.length !== 1 && "s"} selected
          </Box>

          <Button
            size="sm"
            variant="solid"
            disabled={selectedTestCases.length === 0}
            onClick={() => setBulkAssignOpen(true)}
          >
            Bulk assign testers
          </Button>
        </Flex>
        {testCases.test_cases?.map((testCase) => {
          return (
            <Box
              key={testCase.id}
              borderWidth="1px"
              borderRadius="md"
              p={4}
              mb={3}
            >
              <Flex justify="space-between" align="center">
                <Checkbox.Root
                  checked={selectedTestCases.some(
                    (t) => t.test_case_id === testCase.id!.toString()
                  )}
                  onCheckedChange={(e) => {
                    if (e.checked) {
                      setSelectedTestCases((prev) => [
                        ...prev,
                        { test_case_id: testCase.id!.toString(), user_ids: [] },
                      ]);
                    } else {
                      setSelectedTestCases((prev) =>
                        prev.filter((t) => t.test_case_id !== testCase.id!.toString())
                      );
                    }
                  }}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                  <Checkbox.Label>
                    <strong>{testCase.code}</strong> — {testCase.title}
                  </Checkbox.Label>
                </Checkbox.Root>

                <Button size="sm" onClick={() => openAssignModal(Number(testCase.id!))}>
                  Assign testers
                </Button>
              </Flex>

              {/* Assigned testers preview */}
              {selectedTestCases.find((t) => t.test_case_id === testCase.id!.toString())
                ?.user_ids.length ? (
                <Flex mt={2} gap={2} wrap="wrap">
                  {selectedTestCases
                    .find((t) => t.test_case_id === testCase.id!.toString())!
                    .user_ids.map((uid) => {
                      const tester = testers.find(
                        (t) => t.user_id?.toString() === uid.toString()
                      );
                      return (
                        <Box
                          key={uid}
                          px={2}
                          py={1}
                          bg="gray.100"
                          borderRadius="md"
                          fontSize="sm"
                        >
                          {tester?.name}
                        </Box>
                      );
                    })}
                </Flex>
              ) : (
                <Box mt={2} fontSize="sm" color="gray.500">
                  No testers assigned
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      <Dialog.Root
        open={!!activeTestCaseId}
        onOpenChange={() => setActiveTestCaseId(null)}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>Assign testers to test case</Dialog.Header>
              <Dialog.Body>
                <CheckboxGroup
                  value={activeTestCase?.user_ids.map(String) ?? []}
                  onValueChange={(value) => {
                    setSelectedTestCases((prev) =>
                      prev.map((t) =>
                        t.test_case_id === activeTestCaseId
                          ? { ...t, user_ids: value.map(Number) }
                          : t
                      )
                    );
                  }}
                >
                  <Fieldset.Root>
                    <Fieldset.Legend fontSize="sm">
                      Select testers
                    </Fieldset.Legend>

                    <Fieldset.Content>
                      <For each={testers}>
                        {(tester) => (
                          <Checkbox.Root
                            key={tester.user_id}
                            value={tester.user_id!.toString()}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                            <Checkbox.Label>{tester.name}</Checkbox.Label>
                          </Checkbox.Root>
                        )}
                      </For>
                    </Fieldset.Content>
                  </Fieldset.Root>
                </CheckboxGroup>
              </Dialog.Body>

              <Dialog.Footer>
                <Button onClick={() => setActiveTestCaseId(null)}>Done</Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      <Dialog.Root
        open={bulkAssignOpen}
        onOpenChange={(e) => setBulkAssignOpen(e.open)}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>Bulk assign testers</Dialog.Header>

              <Dialog.Body>
                <Box fontSize="sm" mb={3} color="gray.600">
                  Selected testers will be assigned to{" "}
                  <strong>{selectedTestCases.length}</strong> test cases.
                  Existing assignments will be kept.
                </Box>

                <CheckboxGroup
                  value={bulkSelectedTesters}
                  onValueChange={setBulkSelectedTesters}
                >
                  <Fieldset.Root>
                    <Fieldset.Legend fontSize="sm">
                      Select testers
                    </Fieldset.Legend>

                    <Fieldset.Content>
                      <For each={testers}>
                        {(tester) => (
                          <Checkbox.Root
                            key={tester.user_id}
                            value={tester.user_id!.toString()}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                            <Checkbox.Label>{tester.name}</Checkbox.Label>
                          </Checkbox.Root>
                        )}
                      </For>
                    </Fieldset.Content>
                  </Fieldset.Root>
                </CheckboxGroup>
              </Dialog.Body>

              <Dialog.Footer>
                <Button
                  variant="outline"
                  onClick={() => setBulkAssignOpen(false)}
                >
                  Cancel
                </Button>

                <Button
                  disabled={bulkSelectedTesters.length === 0}
                  onClick={() => {
                    setSelectedTestCases((prev) =>
                      prev.map((tc) => ({
                        ...tc,
                        user_ids: Array.from(
                          new Set([...tc.user_ids, ...bulkSelectedTesters.map(Number)])
                        ),
                      }))
                    );

                    setBulkSelectedTesters([]);
                    setBulkAssignOpen(false);
                  }}
                >
                  Assign testers
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </div>
  );
}
