import { createFileRoute } from "@tanstack/react-router";
import {
  Box,
  Button,
  Field,
  Flex,
  Heading,
  Input,
} from "@chakra-ui/react";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useCreateUserMutation } from "@/services/UserService";
import { toaster } from "@/components/ui/toaster";
import { useState } from "react";

export const Route = createFileRoute("/(app)/users/new/")({
  component: CreateNewUser,
});

function CreateNewUser() {
  const createUserMutation = useCreateUserMutation();
  const redirect = useNavigate();
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: {
    display_name?: string;
    first_name: string;
    last_name: string;
    password: string;
    email: string;
  }) {
    const res = await createUserMutation.mutateAsync({
      body: {
        display_name: `${e.first_name} ${e.last_name}`,
        first_name: e.first_name,
        last_name: e.last_name,
        password: e.password,
        email: e.email,
      },
    });

    if (res) {
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
      setSubmitting(true)
      try {
        return handleSubmit(value);
      } catch(err) {
        toaster.create({
          title: "Failed to create user account.",
          description: "Failed to create new user account",
          type: "error",
          duration: 3000,
        });
      } finally {
        setSubmitting(false)
      }
    },
  });
  return (
    <Box>
      <Heading size="3xl">Add New User</Heading>
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <Flex gap="4">
      <form.Field
        name="first_name"
        children={(field) => (
          <Field.Root>
            <Field.Label>First Name</Field.Label>
            <Input
              type="text"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <Field.HelperText>First name of the user</Field.HelperText>
          </Field.Root>
        )}
      />
      <form.Field
        name="last_name"
        children={(field) => (
          <Field.Root>
            <Field.Label>Last Name</Field.Label>
            <Input
              type="text"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <Field.HelperText>Last name of the user</Field.HelperText>
          </Field.Root>
        )}
      />
      </Flex>
      <form.Field
        name="email"
        children={(field) => (
          <Field.Root>
            <Field.Label>E-mail</Field.Label>
            <Input
              type="email"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <Field.HelperText>Email of the user</Field.HelperText>
          </Field.Root>
        )}
      />
      <form.Field
        name="password"
        children={(field) => (
          <Field.Root>
            <Field.Label>Password</Field.Label>
            <Input
              type="password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <Field.HelperText>Choose a password for the user</Field.HelperText>
          </Field.Root>
        )}
      />

      <Button type="submit" variant="outline" loading={submitting}>Submit</Button>
    </form>
    </Box>
  );
}
