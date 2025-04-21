import { createFileRoute } from "@tanstack/react-router";
import {
  Button,
  Field,
  Input,
} from "@chakra-ui/react";
import { useForm } from "@tanstack/react-form";

import { useNavigate } from "@tanstack/react-router";
import ProjectService from "@/services/ProjectService";
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
  const projectService = new ProjectService();
  const redirect = useNavigate();
  async function handleSubmit(e: {
    name: unknown;
    description: unknown;
    version: unknown;
    website_url: unknown;
  }) {
    const res = await projectService.create({
      name: e.name,
      description: e.description,
      version: e.version,
      website_url: e.website_url,
    });

    if (res.status == 200) {
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
  );
}
