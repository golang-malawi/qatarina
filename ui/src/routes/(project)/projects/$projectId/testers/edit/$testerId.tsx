import {Box, Heading, Spinner, Text} from "@chakra-ui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DynamicForm, FieldConfig } from "@/components/form";
import { toaster } from "@/components/ui/toaster";
import {z} from "zod";
import {useTesterQuery, useUpdateTesterRoleMutation} from "@/services/TesterService";

export const Route = createFileRoute(
    "/(project)/projects/$projectId/testers/edit/$testerId"
)({
    component: EditTesterPage,
});

function EditTesterPage(){
    const {projectId, testerId} = Route.useParams();
    const navigate = useNavigate();
    const updateMutation = useUpdateTesterRoleMutation();
    const [submitting, setSubmitting] = useState(false);

    const {data: testerData,isPending, isError} = useTesterQuery(testerId);

    if (isPending) return <Spinner size="lg" color="brand.solid" />
    if (isError) return <Text color="fg.error">Failed to load tester</Text>

    const schema = z.object({
        role: z.enum([
            "Lead Tester",
            "Dev Team Member",
            "QA Engineer",
            "Admin",
            "Guest Tester",
            "User",

        ]),
    });
    
    const fields: FieldConfig[] = [
        {
            name: "role",
            label: "Role",
            type: "select",
            options: [
                {label: "Lead Tester", value: "Lead Tester"},
                {label: "Dev Team Member", value: "Dev Team Member"},
                {label: "QA Engineer", value: "QA Engineer"},
                {label: "Admin", value: "Admin"},
                {label: "Guest Tester", value: "Guest Tester"},
                {label: "User", value: "User"},
            ],
            defaultValue: testerData?.role,

        },
    ];

    const handleSubmit = async (values: {role: string}) => {
        setSubmitting(true);
        try {
            await updateMutation.mutateAsync({
                params: {path: {testerID: testerId}},
                body: {role: values.role},
            });
            toaster.success({title: "Tester role updated"});
            navigate({to: "/projects/$projectId/testers", params: {projectId}});
        } catch{
            toaster.error({title: "Failed to update tester role"});
        } finally {
            setSubmitting(false);
        }        
    };

    return (
        <Box p={6}>
            <Heading size="lg" mb={4} color="fg.heading">
                Edit Tester Role
            </Heading>
            <DynamicForm 
            schema={schema}
            fields={fields}
            onSubmit={handleSubmit}
            submitText="Update role"
            submitLoading={submitting}
            layout="vertical"
            spacing={4}
            />
        </Box>
    );
}
