import { createFileRoute } from "@tanstack/react-router";
import { Box, Heading } from "@chakra-ui/react";
import { useNavigate } from "@tanstack/react-router";
import { useCreateUserMutation } from "@/services/UserService";
import { toaster } from "@/components/ui/toaster";
import { useState } from "react";
import { DynamicForm } from "@/components/form/DynamicForm";
import { userCreationSchema } from "@/data/forms/user-schemas";
import { userCreationFields as userFields } from "@/data/forms/user-field-configs";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/workspace/users/new/")({
  component: CreateNewUser,
});

function CreateNewUser() {
  const { t } = useTranslation();
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
          title: t("users.new.success"),
          description: t("users.new.success_description"),
          type: "success",
          duration: 3000,
        });
        redirect({ to: "/workspace/users" });
      }
    } catch {
      toaster.create({
        title: t("users.new.error"),
        description: t("users.new.error_description"),
        type: "error",
        duration: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box p={6}>
      <Heading size="3xl" color="fg.heading">
        {t("users.new.title")}
      </Heading>
      <DynamicForm
        schema={userCreationSchema}
        fields={userFields}
        onSubmit={handleSubmit}
        submitText={t("users.new.submit")}
        submitLoading={submitting}
        layout="vertical"
        spacing={4}
      />
    </Box>
  );
}
