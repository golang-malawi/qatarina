import { Box, Heading, Spinner, Text } from "@chakra-ui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAssignTestersMutation } from "@/services/TesterService";
import { useUsersQuery } from "@/services/UserService";
import { DynamicForm, FieldConfig } from "@/components/form";
import { toaster } from "@/components/ui/toaster";
import { useState } from "react";
import { z } from "zod";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/testers/new"
)({
  component: AddTesterPage,
});

function AddTesterPage() {
  const { t } = useTranslation();
  const { projectId } = Route.useParams();
  const projectID = Number(projectId);
  const assignMutation = useAssignTestersMutation();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const { data: usersData, isPending, isError } = useUsersQuery();

  if (isPending) return <Spinner size="lg" color="brand.solid" />;
  if (isError) return <Text color="fg.error">{t("testers.error.load_users")}</Text>;

  const users = usersData?.users ?? [];
  const userOptions = users.map((u: any) => ({
    label: u.displayName,
    value: String(u.id),
  }));

  const schema = z.object({
    user_id: z.coerce.number(),
    role: z.enum([
      t("testers.roles.lead"),
      t("testers.roles.dev_member"),
      t("testers.roles.qa"),
      t("testers.roles.admin"),
      t("testers.roles.guest"),
      t("testers.roles.user"),
    ]),
  });

  const fields: FieldConfig[] = [
    { name: "user_id", label: t("testers.new.user"), type: "select", options: userOptions },
    {
      name: "role",
      label: t("testers.new.role"),
      type: "select",
      options: [
        { label: t("testers.roles.lead"), value: "Lead Tester" },
        { label: t("testers.roles.dev_member"), value: "Dev Team Member" },
        { label: t("testers.roles.qa"), value: "QA Engineer" },
        { label: t("testers.roles.admin"), value: "Admin" },
        { label: t("testers.roles.guest"), value: "Guest Tester" },
        { label: t("testers.roles.user"), value: "User" },
      ],
    },
  ];

  const handleSubmit = async (values: { user_id: number; role: string }) => {
    setSubmitting(true);
    try {
      await assignMutation.mutateAsync({
        params: { path: { projectID } },
        body: {
          project_id: projectID,
          testers: [
            {
              user_id: Number(values.user_id),
              role: values.role,
            },
          ],
        },
      });
      toaster.create({
        title: t("testers.new.success"),
        description: t("testers.new.success_description"),
        type: "success",
      });
      navigate({ to: "/projects/$projectId/testers", params: { projectId } });
    } catch {
      toaster.create({
        title: t("testers.new.error"),
        description: t("testers.new.error_description"),
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box p={6}>
      <Heading size="lg" mb={4} color="fg.heading">
        {t("testers.new.title")}
      </Heading>
      <DynamicForm
        schema={schema}
        fields={fields}
        onSubmit={handleSubmit}
        submitText={t("testers.new.submit")}
        submitLoading={submitting}
        layout="vertical"
        spacing={4}
      />
    </Box>
  );
}
