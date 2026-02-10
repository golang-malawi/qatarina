import {Box, Heading, Spinner, Text} from "@chakra-ui/react";
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {useAssignTestersMutation} from "@/services/TesterService";
import { useUsersQuery } from "@/services/UserService";
import { DynamicForm, FieldConfig } from "@/components/form";
import {toaster} from "@/components/ui/toaster";
import {useState} from "react";
import {z} from "zod";

export const Route = createFileRoute(
  '/(project)/projects/$projectId/testers/new',
)({
  component: AddTesterPage,
});

function AddTesterPage() {
    const {projectId} = Route.useParams();
    const projectID = Number(projectId);
    const assignMutation = useAssignTestersMutation();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);

    const {data: usersData, isPending, isError} = useUsersQuery();

    if (isPending) return <Spinner size="lg" color="brand.solid" />;
    if (isError) return <Text color="fg.error">Failed to load users</Text>;

    const users = usersData?.users ?? [];
    const userOptions = users.map((u: any) => ({
        label: u.displayName,
        value: String(u.id),
    }));

    const schema = z.object({
        user_id: z.coerce.number(),
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
        {name: "user_id", label: "User", type: "select", options: userOptions},
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
        },
    ];

    const handleSubmit = async (values: {user_id: number; role: string}) => {
        setSubmitting(true);
        try{
            await assignMutation.mutateAsync({
                params: {path: {projectID}},
                body: {
                    project_id: projectID,
                    testers: [{
                        user_id: Number(values.user_id),
                        role: values.role,
                    },
                ],
                },
            });
            toaster.create({
                title: "Tester assigned",
                description: "Successfully added tester to project",
                type: "success",
            });
            navigate({to: "/projects/$projectId/testers", params: {projectId}});
        }catch {
            toaster.create({
                title: "Failed to assign tester",
                description: "Could not add tester to project",
                type: "error",
            });
        }finally {
            setSubmitting(false);
        }
    };

    return (
        <Box p={6}>
            <Heading size="lg" mb={4} color="fg.heading">
                Assign New Tester To This Project
            </Heading>
            <DynamicForm 
            schema={schema}
            fields={fields}
            onSubmit={handleSubmit}
            submitText="Assign Tester"
            submitLoading={submitting}
            layout="vertical"
            spacing={4}
            />

        </Box>
    );
}
