import { createFileRoute } from "@tanstack/react-router";
import { Box, Heading } from "@chakra-ui/react";
import { useNavigate } from "@tanstack/react-router";
import { useCreateProjectMutation } from "@/services/ProjectService";
import { toaster } from "@/components/ui/toaster";
import { DynamicForm } from "@/components/form/DynamicForm";
import { projectCreationSchema } from "@/data/forms/project-schemas";
import { projectCreationFields } from "@/data/forms/project-field-configs";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/workspace/projects/new/")({
  component: CreateProject,
});

function CreateProject() {
  const { t } = useTranslation();
  const createProjectMutation = useCreateProjectMutation();
  const redirect = useNavigate();

  const handleSubmit = async (values: {
    name: string;
    description: string;
    code?: string;
    version: string;
    website_url?: string;
    environments?: { name: string; description?: string; base_url?: string }[];
  }) => {
    try {
      const res = await createProjectMutation.mutateAsync({
        body: {
          name: values.name,
          description: values.description,
          code: values.code!,
          version: values.version,
          website_url: values.website_url || "",
          environments: values.environments || [],
        },
      });

      if (res) {
        toaster.create({
          title: t("projects.create.success"),
          description: t("projects.create.description"),
          type: "success",
          duration: 9000,
        });
        redirect({ to: "/workspace/projects" });
      }
    } catch {
      toaster.create({
        title: t("projects.create.error"),
        description: t("projects.create.error_description"),
        type: "error",
        duration: 3000,
      });
    }
  };

  return (
    <Box>
      <Heading size="3xl">{t("projects.create_new")}</Heading>

      <DynamicForm
        schema={projectCreationSchema}
        fields={projectCreationFields}
        onSubmit={handleSubmit}
        submitText={t("projects.create")}
        layout="vertical"
        spacing={4}
      />
    </Box>
  );
}
