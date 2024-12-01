import { Button, Input } from "@chakra-ui/react";
import { useForm } from "@tanstack/react-form";
import UserService from "@/services/UserService";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Field } from "@/components/ui/field";
import { toaster } from "@/components/ui/toaster";

export const Route = createFileRoute("/(app)/_layout/users/new")({
  component: CreateNewUser,
});

function CreateNewUser() {
  const userService = new UserService();
  const redirect = useNavigate();

  async function handleSubmit(e: {
    display_name?: string;
    first_name: unknown;
    last_name: unknown;
    password: unknown;
    email: unknown;
  }) {
    const res = await userService.create({
      display_name: `${e.first_name} ${e.last_name}`,
      first_name: e.first_name,
      last_name: e.last_name,
      password: e.password,
      email: e.email,
    });

    if (res.status == 200) {
      toaster.create({
        title: "User created.",
        description: "We've created your new Team mate.",
        type: "success",
        duration: 3000,
      });
      redirect({ to: "/users" });
    }

    return false;
  }

  const form = useForm({
    defaultValues: {
      display_name: "",
      first_name: "",
      last_name: "",
      password: "",
      email: "",
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
        name="first_name"
        children={(field) => (
          <Field label="First Name" helperText="First name of the user">
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
        name="last_name"
        children={(field) => (
          <Field label="Last Name" helperText="Last name of the user">
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
        name="email"
        children={(field) => (
          <Field label="E-mail" helperText="Email of the user">
            <Input
              type="email"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </Field>
        )}
      />
      <form.Field
        name="password"
        children={(field) => (
          <Field label="Password" helperText="Choose a password for the user">
            <Input
              type="password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </Field>
        )}
      />

      <Button type="submit">Create New</Button>
    </form>
  );
}
