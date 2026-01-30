import { Box, Heading } from "@chakra-ui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toaster } from "@/components/ui/toaster";
import ModuleService from "@/services/ModuleService";
import { DynamicForm } from "@/components/form/DynamicForm";
import { featureModuleCreationSchema, FeatureModuleCreationFormData } from "@/data/forms/feature-module-schemas";
import { featureModuleCreationFields } from "@/data/forms/feature-module-field-configs";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/Features/CreateFeatureModuleForm"
)({
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const navigate = useNavigate();
  const moduleService = new ModuleService();

  async function handleSubmit(values: FeatureModuleCreationFormData) {
    const payload = {
      name: values.name,
      type: values.type,
      description: values.description || "",
      code: values.code,
      priority: Number(values.priority),
      project_id: parseInt(params.projectId),
    };

    try {
      const res = await moduleService.createModule(payload)

      if (!res || (res as any).type === "problemdetail.example.com/http/types/BadRequest"){
        throw new Error((res as any).detail || "Failed to create module");
      }
      
      toaster.create({
        title: "Module created",
        description: `We've created ${values.type}: ${values.name}`,
        type: "success",
        duration: 3000,
      });

      navigate({ to: `/projects/${params.projectId}` });
    } catch (err) {
      console.error(err);
      toaster.create({
        title: "Failed to create",
        description: "There was an error creating the module.",
        type: "error",
        duration: 3000,
      });
    }
  }

  return (
    <Box>
      <Heading>Create Feature / Component / Module</Heading>
      <DynamicForm
        schema={featureModuleCreationSchema}
        fields={featureModuleCreationFields}
        onSubmit={handleSubmit}
        submitText="Create"
        layout="vertical"
        spacing={4}
      />
    </Box>
  );
}
