import { Box, Heading } from "@chakra-ui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toaster } from "@/components/ui/toaster";
import ModuleService from "@/services/ModuleService";
import { DynamicForm } from "@/components/form/DynamicForm";
import {
  featureModuleCreationSchema,
  FeatureModuleCreationFormData,
} from "@/data/forms/feature-module-schemas";
import { featureModuleCreationFields } from "@/data/forms/feature-module-field-configs";
import SelectParentModule from "@/components/form/SelectParentModule";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/Features/CreateFeatureModuleForm"
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const params = Route.useParams();
  const navigate = useNavigate();
  const moduleService = new ModuleService();
  const fields = [
    ...featureModuleCreationFields,
    {
      name: "parent_module_id",
      label: t("features.form.parent"),
      type: "custom" as const,
      helperText: t("features.form.parent_helper"),
      customComponent: ({ value, onChange }: { value: unknown; onChange: (value: unknown) => void }) => (
        <SelectParentModule
          projectId={params.projectId}
          value={(value as string) || ""}
          onChange={onChange}
        />
      ),
    },
  ];

  async function handleSubmit(values: FeatureModuleCreationFormData) {
    const payload = {
      name: values.name,
      type: values.type,
      description: values.description || "",
      code: values.code,
      priority: Number(values.priority),
      project_id: parseInt(params.projectId),
      parent_module_id: values.parent_module_id
        ? Number(values.parent_module_id)
        : undefined,
    };

    try {
      await moduleService.createModule(payload);

      toaster.create({
        title: t("features.create.success"),
        description: t("features.create.success_description", {
          type: values.type,
          name: values.name,
        }),
        type: "success",
        duration: 3000,
      });

      navigate({
        to: "/projects/$projectId/Features",
        params: { projectId: params.projectId },
      });
    } catch (err) {
      console.error(err);
      toaster.create({
        title: t("features.create.error"),
        description:
          err instanceof Error && err.message
            ? err.message
            : t("features.create.error_description"),
        type: "error",
        duration: 3000,
      });
    }
  }

  return (
    <Box p={6}>
      <Heading color="fg.heading">{t("features.create.title")}</Heading>
      <DynamicForm
        schema={featureModuleCreationSchema}
        fields={fields}
        onSubmit={handleSubmit}
        submitText={t("features.create.submit")}
        layout="vertical"
        spacing={4}
      />
    </Box>
  );
}
