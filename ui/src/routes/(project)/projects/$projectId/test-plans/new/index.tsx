import { createFileRoute } from "@tanstack/react-router";
import {
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  CloseButton,
  Dialog,
  Fieldset,
  Flex,
  For,
  Heading,
  Portal,
} from "@chakra-ui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { SelectAssignedTestCase, CreateTestPlan } from "@/common/models";
import { useCreateTestPlanMutation } from "@/services/TestPlanService";
import { useTestersQuery } from "@/services/TesterService";
import { testCasesByProjectIdQueryOptions } from "@/data/queries/test-cases";
import { toaster } from "@/components/ui/toaster";
import { DynamicForm } from "@/components/DynamicForm";
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
  const [open, setOpen] = useState(false);

  const [selectedTestCases, setSelectedTestCases] = useState<
    SelectAssignedTestCase[]
  >([]);
  const [selectedTesters, setSelectedTesters] = useState<string[]>([]);

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

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const testers = testersQuery.data?.testers ?? [];

  async function handleSubmit(data: CreateTestPlanForm) {
    const res = await createTestPlanMutation.mutateAsync({
      body: {
        project_id: parseInt(projectId!),
        assigned_to_id: data.assigned_to_id,
        kind: data.kind,
        description: data.description,
        start_at: data.start_at,
        closed_at: data.closed_at,
        scheduled_end_at: data.scheduled_end_at,
        planned_tests: [],
      },
    });

    if (res) {
      toaster.create({
        title: "Test Plan created.",
        description:
          "We've created your Test Plan - please add test cases to it.",
        type: "success",
        duration: 3000,
      });
      redirect({
        to: "/projects/$projectId/test-plans",
        params: {
          projectId: projectId,
        },
      });
    }
  }

  return (
    <div>
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
        {testCases.test_cases?.map((testCase) => {
          return (
            <Box key={testCase.id}>
              <Flex>
                <Box>
                  <Checkbox.Root
                    name={`testCase-${testCase.id}`}
                    onCheckedChange={(e) => {
                      const checked = e.checked;
                      if (checked) {
                        const newSelected = {
                          test_case_id: testCase.id!,
                          user_ids: [],
                        };
                        setSelectedTestCases([
                          ...selectedTestCases,
                          newSelected,
                        ]);
                      }
                    }}
                  />{" "}
                  {testCase.code} - {testCase.title} (Tags:{" "}
                  {testCase.tags?.join(", ")})
                </Box>
                <Box>
                  <Button onClick={() => setOpen(true)}>Assign Testers</Button>
                  {/* <SelectTesterModal testCaseID={t.ID} selectedTesters={selectedTesters} setSelectedTesters={setSelectedTesters} /> */}
                  {/* <Button size="xs" onClick={showSelectTesterTray(t.ID)}>Assign Testers</Button> */}
                </Box>
              </Flex>
            </Box>
          );
        })}
      </Box>
      <Dialog.Root lazyMount open={open} onOpenChange={(e) => setOpen(e.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>Select Testers to Assign</Dialog.Header>
              <CloseButton />
              <Dialog.Body>
                <Fieldset.Root>
                  <CheckboxGroup
                    value={selectedTesters}
                    onValueChange={setSelectedTesters}
                  >
                    <Fieldset.Legend fontSize="sm" mb="2">
                      Select Testers
                    </Fieldset.Legend>
                    <Fieldset.Content>
                      <For each={testers}>
                        {(value) => (
                          <Checkbox.Root
                            key={value.user_id}
                            value={value.user_id?.toString()}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                            <Checkbox.Label>{value.name}</Checkbox.Label>
                          </Checkbox.Root>
                        )}
                      </For>
                    </Fieldset.Content>
                  </CheckboxGroup>
                </Fieldset.Root>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline">Cancel</Button>
                </Dialog.ActionTrigger>
                <Button variant="ghost">Assign Testers</Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </div>
  );
}
