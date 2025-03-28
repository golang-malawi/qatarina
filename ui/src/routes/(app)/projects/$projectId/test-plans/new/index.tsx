import { createFileRoute } from "@tanstack/react-router";
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
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { SelectAssignedTestCase, TesterRecord } from "@/common/models";
import TestPlanService from "@/services/TestPlanService";
import TesterService from "@/services/TesterService";
import { testCasesByProjectIdQueryOptions } from "@/data/queries/test-cases";

export const Route = createFileRoute(
  "/(app)/projects/$projectId/test-plans/new/"
)({
  loader: ({ context: { queryClient }, params: { projectId } }) =>
    queryClient.ensureQueryData(testCasesByProjectIdQueryOptions(projectId)),
  component: CreateNewTestPlan,
});

function CreateNewTestPlan() {
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
  } = useSuspenseQuery(testCasesByProjectIdQueryOptions(projectId));

  if (isPending) {
    return "Loading Test Cases...";
  }

  if (error) {
    return <div className="error">Error: error fetching test cases</div>;
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
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
    <Box key={t.id}>
      <Flex>
        <Box>
          <Checkbox
            name={`testCase-${t.id}`}
            onChange={(e) => {
              if (e.target.checked) {
                const newSelected = {
                  test_case_id: t.id,
                  user_ids: [],
                };
                setSelectedTestCases([...selectedTestCases, newSelected]);
              }
            }}
          />{" "}
          {t.code} - {t.title} (Tags: {t.tags?.join(", ")})
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
      redirect({
        to: "/projects/$projectId/test-plans",
        params: {
          projectId: projectId,
        },
      });
    }
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
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
