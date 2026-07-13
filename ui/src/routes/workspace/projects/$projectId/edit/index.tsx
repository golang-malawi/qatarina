import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Box, Heading } from "@chakra-ui/react";
import { useUpdateProjectMutation, useProjectQuery, useProjectsQuery } from "@/services/ProjectService";
import { toaster } from "@/components/ui/toaster";
import { DynamicForm } from "@/components/form/DynamicForm";
import { projectUpdateSchema } from "@/data/forms/project-schemas";
import { projectCreationFields } from "@/data/forms/project-field-configs";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/workspace/projects/$projectId/edit/")({
  component: EditProject,
});

function EditProject() {
  const { t } = useTranslation();
  const params = Route.useParams();
  const updateProjectMutation = useUpdateProjectMutation();
  const { data: project } = useProjectQuery(params.projectId);
  const { data: projects } = useProjectsQuery();
  const redirect = useNavigate();

  const handleSubmit = async (values: any) => {
    try {
      await updateProjectMutation.mutateAsync({
        params: { path: { projectID: params.projectId } },
        body: {
          id: project?.id ?? Number(params.projectId),
          project_owner_id: project?.owner_user_id ?? 0,
          name: values.name,
          code: values.code,
          description: values.description,
          version: values.version,
          website_url: values.website_url ?? "",
          github_url: values.github_url ?? "",
          parent_project_id: Number(values.parent_project_id) || 0,
          environments: values.environments ?? [],
        },
      });

      toaster.create({
        title: t("projects.update.success"),
        description: t("projects.update.saved"),
        type: "success",
        duration: 9000,
      });

      redirect({ to: "/workspace/projects" });
    } catch {
      toaster.create({
        title: t("projects.update.error"),
        description: t("projects.update.error_description"),
        type: "error",
        duration: 3000,
      });
    }
  };

  return (
    <Box>
      <Heading size="3xl">{t("projects.edit")}</Heading>

      {project ? (
        <DynamicForm
          schema={projectUpdateSchema}
          fields={[
            ...projectCreationFields,
            {
              name: "parent_project_id",
              label: t("projects.parent_project"),
              type: "select",
              options: (projects?.projects ?? []).map((p) => ({
                label: p.title ?? "",
                value: String(p.id ?? ""),
              })),
            },
          ]}
          defaultValues={{
            id: project.id ?? Number(params.projectId),
            project_owner_id: project?.owner_user_id ?? 0,
            name: project.title ?? "",
            code: project.code ?? "",
            description: project.description ?? "",
            version: project.version ?? "",
            website_url: project.website_url ?? "",
            github_url: project.github_url ?? "",
            parent_project_id: String(project.parent_project_id ?? ""),
            environments: [],
          }}
          onSubmit={handleSubmit}
          submitText={t("projects.update")}
          layout="vertical"
          spacing={4}
        />
      ) : (
        <Heading size="md">{t("projects.loading")}</Heading>
      )}
    </Box>
  );
}
