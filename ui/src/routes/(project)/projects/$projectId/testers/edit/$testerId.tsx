import { Box, Heading, Spinner, Text } from "@chakra-ui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DynamicForm, FieldConfig } from "@/components/form";
import { toaster } from "@/components/ui/toaster";
import { z } from "zod";
import {
  useTesterQuery,
  useUpdateTesterRoleMutation,
} from "@/services/TesterService";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/testers/edit/$testerId"
)({
  component: EditTesterPage,
});

function EditTesterPage() {
  const { t } = useTranslation();
  const { projectId, testerId } = Route.useParams();
  const navigate = useNavigate();
  const updateMutation = useUpdateTesterRoleMutation();
  const [submitting, setSubmitting] = useState(false);
  const { data: testerData, isPending, isError } = useTesterQuery(testerId);

  if (isPending) return <Spinner size="lg" color="brand.solid" />;
  if (isError) return <Text color="fg.error">{t("testers.error.load_single")}</Text>;

  const schema = z.object({
    role: z.enum([
      "Lead Tester",
      "Dev Team Member",
      "QA Engineer",
      "Admin",
      "Guest Tester",
      "User",
    ]),
  });

  const fields: FieldConfig[] = [
    {
      name: "role",
      label: t("testers.edit.role"),
      type: "select",
      options: [
        { label: t("testers.roles.lead"), value: "Lead Tester" },
        { label: t("testers.roles.dev_member"), value: "Dev Team Member" },
        { label: t("testers.roles.qa"), value: "QA Engineer" },
        { label: t("testers.roles.admin"), value: "Admin" },
        { label: t("testers.roles.guest"), value: "Guest Tester" },
        { label: t("testers.roles.user"), value: "User" },
      ],
      defaultValue: (testerData! as any).role,
    },
  ];

  const handleSubmit = async (values: { role: string }) => {
    setSubmitting(true);
    try {
      await updateMutation.mutateAsync({
        params: { path: { testerID: testerId } },
        body: { role: values.role },
      });
      toaster.success({ title: t("testers.edit.success") });
      navigate({ to: "/projects/$projectId/testers", params: { projectId } });
    } catch {
      toaster.error({ title: t("testers.edit.error") });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box p={6}>
      <Heading size="lg" mb={4} color="fg.heading">
        {t("testers.edit.title")}
      </Heading>
      <DynamicForm
        schema={schema}
        fields={fields}
        onSubmit={handleSubmit}
        submitText={t("testers.edit.submit")}
        submitLoading={submitting}
        layout="vertical"
        spacing={4}
      />
    </Box>
  );
}
