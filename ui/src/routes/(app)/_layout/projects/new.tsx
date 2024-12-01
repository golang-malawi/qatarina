import { Button, Input } from "@chakra-ui/react";
import { useForm } from "@tanstack/react-form";

import ProjectService from "@/services/ProjectService";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toaster } from "@/components/ui/toaster";
import { Field } from "@/components/ui/field";

export const Route = createFileRoute("/(app)/_layout/projects/new")({
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
          <Field label="Name" helperText="Project title">
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
        name="version"
        children={(field) => (
          <Field label="Project Version" helperText="Project Version">
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
        name="website_url"
        children={(field) => (
          <Field label="Website URL" helperText="Website URL">
            <Input
              type="text"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </Field>
        )}
      />

      <Button type="submit">Submit</Button>
    </form>
  );
}
