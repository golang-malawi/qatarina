import { Box, Button, Flex, Heading, Input } from "@chakra-ui/react";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  SelectAssignedTestCase,
  TestCase,
  TesterRecord,
} from "@/common/models";
import TestCaseService from "@/services/TestCaseService";
import TestPlanService from "@/services/TestPlanService";
import TesterService from "@/services/TesterService";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toaster } from "@/components/ui/toaster";
import { Field } from "@/components/ui/field";
import {
  DialogActionTrigger,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute(
  "/(app)/_layout/projects/$projectId/test-plans/new"
)({
  component: CreateNewTestPlan,
});

function CreateNewTestPlan() {
  const testCaseService = new TestCaseService();
  const testPlanService = new TestPlanService();
  const testerService = new TesterService();
  const redirect = useNavigate();
  const { projectId } = Route.useParams();

  const [selectedTestCases, setSelectedTestCases] = useState<
    SelectAssignedTestCase[]
  >([]);
  const [selectedTesters, setSelectedTesters] = useState<number[]>([]);

  const {
    data: testCases,
    isPending,
    error,
  } = useQuery<TestCase[]>({
    queryFn: () =>
      testCaseService
        .findByProjectId(parseInt!(projectId!))
        .then((data) => data),
    queryKey: ["projectTestCases", projectId],
  });

  if (isPending) {
    return "Loading Test Cases...";
  }

  if (error) {
    return <div className="error">Error: error fetching test cases</div>;
  }

  const { data: testers } = useQuery<TesterRecord[]>({
    queryFn: () => testerService.findAll().then((data) => data),
    queryKey: ["testers"],
  });

  function addTesterUser(testerID: number) {
    setSelectedTesters([...selectedTesters, testerID]);
  }

  const testerList =
    testers &&
    testers.map((tester, idx) => (
      <Box key={idx}>
        <Checkbox
          checked={selectedTesters.includes(tester.user_id)}
          onCheckedChange={(e) => {
            if (e.checked) {
              addTesterUser(tester.user_id);
            }
          }}
        />{" "}
        {tester.name}
      </Box>
    ));

  const testCaseList = testCases.map((t) => (
    <Box key={t.ID}>
      <Flex>
        <Box>
          <Checkbox
            name={`testCase-${t.ID}`}
            onCheckedChange={(e) => {
              if (e.checked) {
                const newSelected = {
                  test_case_id: t.ID,
                  user_ids: [],
                };
                setSelectedTestCases([...selectedTestCases, newSelected]);
              }
            }}
          />{" "}
          {t.Code} - {t.Title} (Tags: {t.Tags?.join(", ")})
        </Box>
        <Box>
          <DialogRoot>
            <DialogTrigger asChild>
              <Button>Assign Testers</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>Select Testers to Assign</DialogHeader>
              <DialogBody>{testerList}</DialogBody>

              <DialogFooter>
                <DialogActionTrigger asChild>
                  <Button colorScheme="blue" mr={3}>
                    Close
                  </Button>
                </DialogActionTrigger>
                <Button variant="ghost">Assign Testers</Button>
              </DialogFooter>
            </DialogContent>
          </DialogRoot>
          {/* <SelectTesterModal testCaseID={t.ID} selectedTesters={selectedTesters} setSelectedTesters={setSelectedTesters} /> */}
          {/* <Button size="xs" onClick={showSelectTesterTray(t.ID)}>Assign Testers</Button> */}
        </Box>
      </Flex>
    </Box>
  ));

  async function handleSubmit(data: {
    kind: unknown;
    description: unknown;
    start_at: unknown;
    closed_at: unknown;
    scheduled_end_at: unknown;
    assigned_to_id?: unknown;
  }) {
    const res = await testPlanService.create({
      project_id: parseInt(projectId!),
      assigned_to_id: data.assigned_to_id,
      kind: data.kind,
      description: data.description,
      start_at: data.start_at,
      closed_at: data.closed_at,
      scheduled_end_at: data.scheduled_end_at,
      planned_tests: [],
    });

    if (res.status == 200) {
      toaster.create({
        title: "Test Plan created.",
        description:
          "We've created your Test Plan - please add test cases to it.",
        type: "success",
        duration: 3000,
      });
      redirect({ to: `/projects/${projectId}/test-plans` });
    }
  }

  const form = useForm({
    defaultValues: {
      kind: "",
      description: "",
      start_at: "",
      closed_at: "",
      scheduled_end_at: "",
    },
    onSubmit: async ({ value }) => {
      return handleSubmit(value);
    },
  });

  return (
    <div>
      <Box>
        <Heading>Create a Test Plan</Heading>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <form.Field
            name="description"
            children={(field) => (
              <Field label="Description" helperText="Description">
                <Input
                  type="text"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </Field>
            )}
          />

          <form.Field
            name="start_at"
            children={(field) => (
              <Field label="Start At" helperText="Start At">
                <Input
                  type="text"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </Field>
            )}
          />

          <form.Field
            name="scheduled_end_at"
            children={(field) => (
              <Field
                label="Scheduled to End On"
                helperText="Scheduled to End On"
              >
                <Input
                  type="text"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </Field>
            )}
          />

          <form.Field
            name="kind"
            children={(field) => (
              <Field label="Test Plan Kind" helperText="Test Plan Kind">
                <Input
                  type="text"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </Field>
            )}
          />

          <Button type="submit">Create Plan</Button>
        </form>
        <Heading>Select & Assign Test Cases</Heading>
        {testCaseList}
      </Box>
    </div>
  );
}
