import { Box, Heading, Spinner } from "@chakra-ui/react";
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

export const Route = createFileRoute(
  "/(project)/projects/$projectId/Features/EditFeatureModuleForm",
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
          title: "Invalid module ID",
          description: "Module ID is missing or invalid.",
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
          title: "Failed to load module",
          description: "Unable to fetch module details.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchModule();
  }, [moduleId]);

  async function handleSubmit(values: FeatureModuleEditFormData) {
    const payload = {
      id: parseInt(moduleId),
      name: values.name,
      type: values.type,
      description: values.description || "",
      code: values.code,
      priority: values.priority,
    };

    const moduleService = new ModuleService();
    try {
      await moduleService.updateModule(moduleId, payload);

      toaster.create({
        title: "Module updated",
        description: `Successfully updated ${values.type}: ${values.name}`,
        type: "success",
        duration: 3000,
      });

      navigate({ to: `/projects/${projectId}/Features/` });
    } catch (err) {
      console.error(err);
      toaster.create({
        title: "Failed to update",
        description: "An error occurred while updating the module.",
        type: "error",
        duration: 3000,
      });
    }
  }

  if (loading)
    return (
      <Box textAlign="center" mt={50}>
        <Spinner size="xl" />
        <p>Loading module details...</p>
      </Box>
    );

  return (
    <Box>
      <Heading>Edit Feature / Component / Module</Heading>
      <DynamicForm
        schema={featureModuleEditSchema}
        fields={featureModuleEditFields}
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        submitText="Save Changes"
        layout="vertical"
        spacing={4}
      />
    </Box>
  );
}
