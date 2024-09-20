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
    useToast
} from "@chakra-ui/react";
import { useForm } from "@tanstack/react-form";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import SelectTesterModal from "../../components/SelectTesterModal";
import useAuthHeaders from "../../hooks/useAuthHeaders";


interface TestCase {
    ID: number;
    Title?: string;
    Code?: string;
    Description?: string;
    Tags?: string[];
}

interface SelectAssignedTestCase {
    test_case_id: number;
    user_ids: number[]
}

export default function CreateNewTestPlan() {
    const toast = useToast();
    const params = useParams();
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [selectedTestCases, setSelectedTestCases] = useState<SelectAssignedTestCase[]>([]);
    const [selectedTesters, setSelectedTesters] = useState<number[]>([]);
    const redirect = useNavigate();
    const project_id = params.projectID;

    useEffect(() => {
        async function fetchTestCases(projectID: number) {
            const res = await axios.get(`http://localhost:4597/v1/projects/${projectID}/test-cases`, useAuthHeaders())
            if (res.status == 200) {
                setTestCases(res.data.test_cases);
            }
        }

        fetchTestCases(parseInt(project_id!));
    }, [project_id]);

    const testCaseList = testCases.map(t => (<Box key={t.ID}>
        <Flex>
            <Box>
                <Checkbox name={`testCase-${t.ID}`}
                    onChange={(e) => {
                        if (e.target.checked) {
                            const newSelected = {
                                test_case_id: t.ID,
                                user_ids: []
                            };
                            setSelectedTestCases([...selectedTestCases, newSelected]);
                        }
                    }}
                /> {t.Code} - {t.Title} (Tags: {t.Tags?.join(', ')})
            </Box>
            <Box>
                <SelectTesterModal testCaseID={t.ID} selectedTesters={selectedTesters} setSelectedTesters={setSelectedTesters} />
                {/* <Button size="xs" onClick={showSelectTesterTray(t.ID)}>Assign Testers</Button> */}
            </Box>
        </Flex>
    </Box>))

    async function handleSubmit(data: { kind: any; description: any; start_at: any; closed_at: any; scheduled_end_at: any; assigned_to_id?: any; }) {
        const res = await axios.post('http://localhost:4597/v1/test-plans', {
            project_id: parseInt(project_id!),
            assigned_to_id: data.assigned_to_id,
            kind: data.kind,
            description: data.description,
            start_at: data.start_at,
            closed_at: data.closed_at,
            scheduled_end_at: data.scheduled_end_at,
            planned_tests: []
        }, useAuthHeaders());

        if (res.status == 200) {
            toast({
                title: 'Test Plan created.',
                description: "We've created your Test Plan - please add test cases to it.",
                status: 'success',
                duration: 3000,
                isClosable: true,
            })
            redirect(`/projects/${project_id}/test-plans`);
        }
    }

    const form = useForm({
        defaultValues: {
            kind: '',
            description: '',
            start_at: '',
            closed_at: '',
            scheduled_end_at: '',
        },
        onSubmit: async ({ value }) => {
            return handleSubmit(value);
        }
    })



    return (
        <Box>
            <Heading>Create a Test Plan</Heading>
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    form.handleSubmit()
                }}
            >

                <form.Field
                    name="description"
                    children={(field) => (
                        <FormControl>
                            <FormLabel>Description</FormLabel>
                            <Input type='text' value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)} />
                            <FormHelperText>Description</FormHelperText>
                        </FormControl>
                    )}
                />

                <form.Field
                    name="start_at"
                    children={(field) => (
                        <FormControl>
                            <FormLabel>Start At</FormLabel>
                            <Input type='text' value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)} />
                            <FormHelperText>Start At</FormHelperText>
                        </FormControl>
                    )}
                />

                <form.Field
                    name="scheduled_end_at"
                    children={(field) => (
                        <FormControl>
                            <FormLabel>Scheduled to End On</FormLabel>
                            <Input type='text' value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)} />
                            <FormHelperText>Scheduled to End On</FormHelperText>
                        </FormControl>
                    )}
                />

                <form.Field
                    name="kind"
                    children={(field) => (
                        <FormControl>
                            <FormLabel>Test Plan Kind</FormLabel>
                            <Input type='text' value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)} />
                            <FormHelperText>Test Plan Kind</FormHelperText>
                        </FormControl>
                    )}
                />

                <Button type='submit'>Create Plan</Button>
            </form>
            <Heading>Select & Assign Test Cases</Heading>
            {testCaseList}
        </Box>
    )
}