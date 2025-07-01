import { createFileRoute } from "@tanstack/react-router";
import { Box, Button, Field, Heading, Input } from "@chakra-ui/react";
import { useForm } from "@tanstack/react-form";

import { useNavigate } from "@tanstack/react-router";
import { useCreateProjectMutation } from "@/services/ProjectService";
import { toaster } from "@/components/ui/toaster";

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
  async function handleSubmit(e: {
    name: string;
    description: string;
    version: string;
    website_url: string;
  }) {
    const res = await createProjectMutation.mutateAsync({
      body: {
        name: e.name,
        description: e.description,
        version: e.version,
        website_url: e.website_url,
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

    return false;
  }

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      version: "",
      website_url: "",
    },
    onSubmit: async ({ value }) => {
      return handleSubmit(value);
    },
  });

  return (
    <Box>
      <Heading size="3xl">Create a New Project</Heading>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field
          name="name"
          children={(field) => (
            <Field.Root>
              <Field.Label>Name</Field.Label>
              <Input
                type="text"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <Field.HelperText>Project title</Field.HelperText>
            </Field.Root>
          )}
        />

        <form.Field
          name="description"
          children={(field) => (
            <Field.Root>
              <Field.Label>Description</Field.Label>
              <Input
                type="text"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <Field.HelperText>Description</Field.HelperText>
            </Field.Root>
          )}
        />

        <form.Field
          name="version"
          children={(field) => (
            <Field.Root>
              <Field.Label>Project Version</Field.Label>
              <Input
                type="text"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <Field.HelperText>Project Version</Field.HelperText>
            </Field.Root>
          )}
        />

        <form.Field
          name="website_url"
          children={(field) => (
            <Field.Root>
              <Field.Label>Website URL</Field.Label>
              <Input
                type="text"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              <Field.HelperText>Website URL</Field.HelperText>
            </Field.Root>
          )}
        />

        <Button type="submit">Submit</Button>
      </form>
    </Box>
  );
}
