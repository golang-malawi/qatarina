import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  SelectAssignedTestCase,
  TestCase,
  TesterRecord,
} from "../../../../../../common/models";
import TestCaseService from "../../../../../../services/TestCaseService";
import TestPlanService from "../../../../../../services/TestPlanService";
import TesterService from "../../../../../../services/TesterService";
import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";

export const Route = createFileRoute(
  "/(app)/_layout/projects/$projectId/test-plans/new"
)({
  component: CreateNewTestPlan,
});

function CreateNewTestPlan() {
  const testCaseService = new TestCaseService();
  const testPlanService = new TestPlanService();
  const testerService = new TesterService();
  const toast = useToast();
  const redirect = useNavigate();
  const { projectId } = Route.useParams();
  const { isOpen, onOpen, onClose } = useDisclosure();

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
          value={tester.user_id}
          onChange={(e) => {
            if (e.target.checked) {
              addTesterUser(parseInt(e.target.value));
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
            onChange={(e) => {
              if (e.target.checked) {
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
          <Button onClick={onOpen}>Assign Testers</Button>
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
      toast({
        title: "Test Plan created.",
        description:
          "We've created your Test Plan - please add test cases to it.",
        status: "success",
        duration: 3000,
        isClosable: true,
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
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Input
                  type="text"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FormHelperText>Description</FormHelperText>
              </FormControl>
            )}
          />

          <form.Field
            name="start_at"
            children={(field) => (
              <FormControl>
                <FormLabel>Start At</FormLabel>
                <Input
                  type="text"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FormHelperText>Start At</FormHelperText>
              </FormControl>
            )}
          />

          <form.Field
            name="scheduled_end_at"
            children={(field) => (
              <FormControl>
                <FormLabel>Scheduled to End On</FormLabel>
                <Input
                  type="text"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FormHelperText>Scheduled to End On</FormHelperText>
              </FormControl>
            )}
          />

          <form.Field
            name="kind"
            children={(field) => (
              <FormControl>
                <FormLabel>Test Plan Kind</FormLabel>
                <Input
                  type="text"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <FormHelperText>Test Plan Kind</FormHelperText>
              </FormControl>
            )}
          />

          <Button type="submit">Create Plan</Button>
        </form>
        <Heading>Select & Assign Test Cases</Heading>
        {testCaseList}
      </Box>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Select Testers to Assign</ModalHeader>
          <ModalCloseButton />
          <ModalBody>{testerList}</ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
            <Button variant="ghost">Assign Testers</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
