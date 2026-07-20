import { Box, Heading, Spinner, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toaster } from "@/components/ui/toaster";
import ModuleService from "@/services/ModuleService";
import { DynamicForm } from "@/components/form/DynamicForm";
import {
  featureModuleEditSchema,
  FeatureModuleEditFormData,
} from "@/data/forms/feature-module-schemas";
import { featureModuleEditFields } from "@/data/forms/feature-module-field-configs";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/Features/EditFeatureModuleForm"
)({
  component: EditFeatureModuleForm,
  validateSearch: (search) => {
    if (!search.moduleId) throw new Error("Missing moduleId");
    return {
      moduleId: String(search.moduleId),
    };
  },
});

function EditFeatureModuleForm() {
  const { t } = useTranslation();
  const { projectId } = Route.useParams();
  const { moduleId } = Route.useSearch();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [defaultValues, setDefaultValues] = useState<
    FeatureModuleEditFormData | undefined
  >();

  useEffect(() => {
    const fetchModule = async () => {
      if (!moduleId) {
        toaster.create({
          title: t("features.edit.invalid_id"),
          description: t("features.edit.invalid_id_description"),
          type: "error",
        });
        return;
      }

      const moduleService = new ModuleService();
      try {
        const data = await moduleService.getModuleById(moduleId);
        setDefaultValues({
          name: data.name || "",
          type: data.type || "feature",
          description: data.description || "",
          code: data.code || "",
          priority: data.priority || 1,
        });
      } catch (err) {
        console.error(err);
        toaster.create({
          title: t("features.edit.error_load"),
          description: t("features.edit.error_load_description"),
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchModule();
  }, [moduleId, t]);

  async function handleSubmit(values: FeatureModuleEditFormData) {
    const payload = {
      id: parseInt(moduleId),
      name: values.name,
      type: values.type,
      description: values.description || "",
      code: values.code,
      priority: Number(values.priority),
    };

    const moduleService = new ModuleService();
    try {
      await moduleService.updateModule(moduleId, payload);
      toaster.create({
        title: t("features.edit.success"),
        description: t("features.edit.success_description", {
          type: values.type,
          name: values.name,
        }),
        type: "success",
        duration: 3000,
      });

      navigate({
        to: "/projects/$projectId/Features",
        params: { projectId },
      });
    } catch (err) {
      console.error(err);
      toaster.create({
        title: t("features.edit.error"),
        description: t("features.edit.error_description"),
        type: "error",
        duration: 3000,
      });
    }
  }

  if (loading)
    return (
      <Box textAlign="center" mt={50}>
        <Spinner size="xl" color="brand.solid" />
        <Text color="fg.muted">{t("features.edit.loading")}</Text>
      </Box>
    );

  return (
    <Box p={6}>
      <Heading color="fg.heading">{t("features.edit.title")}</Heading>
      <DynamicForm
        schema={featureModuleEditSchema}
        fields={featureModuleEditFields}
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        submitText={t("features.edit.submit")}
        layout="vertical"
        spacing={4}
      />
    </Box>
  );
}
