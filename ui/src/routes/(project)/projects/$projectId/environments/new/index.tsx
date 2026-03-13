import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {Box, Heading} from "@chakra-ui/react";
import {z} from "zod";
import { DynamicForm, FieldConfig } from "@/components/form";
import { useCreateEnvironmentMutation } from "@/services/EnvironmentService";
import { toaster } from "@/components/ui/toaster";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/environments/new/"
)({
  component: CreateEnvironmentPage,
});

const environmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  base_url: z.string().url("Must be a valid URL").optional(),
});

const environmentFields: FieldConfig[] = [
  {
    name: "name",
    label: "Name",
    type: "text",
    placeholder: "Environment name",
    required: true,
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    placeholder: "Optional description",
  },
  {
    name: "base_url",
    label: "Base URL",
    type: "url",
    placeholder: "https://example.com",
  },
];

function CreateEnvironmentPage(){
  const {projectId} = Route.useParams();
  const navigate = useNavigate();
  const mutation = useCreateEnvironmentMutation();

  const handleSubmit = async (values: z.infer<typeof environmentSchema>) => {
    try {
      const res = await mutation.mutateAsync({
        params: {path: {projectID: projectId}},
        body: values,
      });

      if (res) {
        toaster.create({
          title: "Environment created.",
          description: "We have created your environment",
          type: "success",
          duration: 5000,
        });
        navigate({to: "/projects/$projectId/environments", params: {projectId}});
      }
    } catch {
      toaster.create({
        title: "Creation failed.",
        description: "Failed to create environment. Please try again.",
        type: "error",
        duration: 3000,
      });
    }
  };

  return (
    <Box>
      <Heading size="lg" mb={4}>Create Environment</Heading>
      <DynamicForm
        schema={environmentSchema}
        fields={environmentFields}
        onSubmit={handleSubmit}
        submitText="Create Environment"
        layout="vertical"
        spacing={4}
      ></DynamicForm>
    </Box>
  );
}