import { createFileRoute } from "@tanstack/react-router";
import { Box, Heading } from "@chakra-ui/react";
import { useNavigate } from "@tanstack/react-router";
import { useCreateUserMutation } from "@/services/UserService";
import { toaster } from "@/components/ui/toaster";
import { useState } from "react";
import { DynamicForm } from "@/components/form/DynamicForm";
import { userCreationSchema } from "@/data/forms/user-schemas";
import { userCreationFields as userFields } from "@/data/forms/user-field-configs";

export const Route = createFileRoute("/(app)/users/new/")({
  component: CreateNewUser,
});

function CreateNewUser() {
  const createUserMutation = useCreateUserMutation();
  const redirect = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
  }) => {
    setSubmitting(true);
    try {
      const res = await createUserMutation.mutateAsync({
        body: {
          display_name: `${values.first_name} ${values.last_name}`,
          first_name: values.first_name,
          last_name: values.last_name,
          password: values.password,
          email: values.email,
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
    } catch {
      toaster.create({
        title: "Failed to create user account.",
        description: "Failed to create new user account",
        type: "error",
        duration: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Heading size="3xl">Add New User</Heading>
      <DynamicForm
        schema={userCreationSchema}
        fields={userFields}
        onSubmit={handleSubmit}
        submitText="Create User"
        submitLoading={submitting}
        layout="vertical"
        spacing={4}
      />
    </Box>
  );
}
