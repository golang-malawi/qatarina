import { createFileRoute } from "@tanstack/react-router";
import { Box, Heading } from "@chakra-ui/react";
import { useNavigate } from "@tanstack/react-router";
import { useCreateProjectMutation } from "@/services/ProjectService";
import { toaster } from "@/components/ui/toaster";
import { DynamicForm } from "@/components/DynamicForm";
import { projectCreationSchema } from "@/data/forms/project-schemas";
import { projectCreationFields } from "@/data/forms/project-field-configs";

export const Route = createFileRoute("/(app)/projects/new/")({
  component: CreateProject,
});

// interface newProjectRequest = {
//   name: string;
//   description: string;
//   version: string;
//   github_url: string;
//   website_url: string;
// }

function CreateProject() {
  const createProjectMutation = useCreateProjectMutation();
  const redirect = useNavigate();

  const handleSubmit = async (values: {
    name: string;
    description: string;
    version: string;
    website_url?: string;
  }) => {
    try {
      const res = await createProjectMutation.mutateAsync({
        body: {
          name: values.name,
          description: values.description,
          version: values.version,
          website_url: values.website_url || "",
        },
      });

      if (res) {
        toaster.create({
          title: "Project created.",
          description: "We've created your Project.",
          type: "success",
          duration: 9000,
        });
        redirect({ to: "/projects" });
      }
    } catch {
      toaster.create({
        title: "Project creation failed.",
        description: "Failed to create project. Please try again.",
        type: "error",
        duration: 3000,
      });
    }
  };

  return (
    <Box>
      <Heading size="3xl">Create a New Project</Heading>
      <DynamicForm
        schema={projectCreationSchema}
        fields={projectCreationFields}
        onSubmit={handleSubmit}
        submitText="Create Project"
        layout="vertical"
        spacing={4}
      />
    </Box>
  );
}
