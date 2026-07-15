import { createFileRoute } from "@tanstack/react-router";
import { Box, Heading } from "@chakra-ui/react";
import { useNavigate } from "@tanstack/react-router";
import { useCreateOrgMutation } from "@/services/OrgsService";
import { toaster } from "@/components/ui/toaster";
import { useState } from "react";
import { DynamicForm } from "@/components/form/DynamicForm";
import { orgSchema } from "@/data/forms/org-schemas";
import { orgFields } from "@/data/forms/org-field-configs";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/workspace/organizations/new/")({
  component: CreateNewOrg,
});

function CreateNewOrg() {
  const { t } = useTranslation();
  const createOrgMutation = useCreateOrgMutation();
  const redirect = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: {
    name: string;
    country?: string;
    github_url?: string;
    website_url?: string;
  }) => {
    setSubmitting(true);
    try {
      const res = await createOrgMutation.mutateAsync({ body: values });
      if (res) {
        toaster.create({
          title: t("organizations.new.success"),
          description: t("organizations.new.description"),
          type: "success",
          duration: 3000,
        });
        redirect({ to: "/workspace/organizations" });
      }
    } catch (err: any) {
      if (err.name === "CancelledError") return;
      toaster.create({
        title: t("organizations.new.error_title"),
        description: t("organizations.new.error"),
        type: "error",
        duration: 3000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Heading size="3xl">{t("organizations.new.title")}</Heading>
      <DynamicForm
        schema={orgSchema}
        fields={orgFields}
        onSubmit={handleSubmit}
        submitText={t("organizations.create_button")}
        submitLoading={submitting}
        layout="vertical"
        spacing={4}
      />
    </Box>
  );
}
