import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Box, Heading } from "@chakra-ui/react";
import { z } from "zod";
import { DynamicForm, FieldConfig } from "@/components/form";
import { useCreateEnvironmentMutation } from "@/services/EnvironmentService";
import { toaster } from "@/components/ui/toaster";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/environments/new/"
)({
  validateSearch: (search) => {
    return {
      from: (search as any)?.from as string | undefined,
    };
  },
  component: CreateEnvironmentPage,
});

function CreateEnvironmentPage() {
  const { t } = useTranslation();
  const { projectId } = Route.useParams();
  const { from } = Route.useSearch();
  const navigate = useNavigate();
  const mutation = useCreateEnvironmentMutation();

  const environmentSchema = z.object({
    name: z.string().min(1, t("environments.new.validation.name_required")),
    description: z.string().optional(),
    base_url: z.string().url(t("environments.new.validation.url")).optional(),
  });

  const environmentFields: FieldConfig[] = [
    {
      name: "name",
      label: t("environments.new.field.name"),
      type: "text",
      placeholder: t("environments.new.placeholder.name"),
      required: true,
    },
    {
      name: "description",
      label: t("environments.new.field.description"),
      type: "textarea",
      placeholder: t("environments.new.placeholder.description"),
    },
    {
      name: "base_url",
      label: t("environments.new.field.base_url"),
      type: "url",
      placeholder: t("environments.new.placeholder.base_url"),
    },
  ];

  const handleSubmit = async (values: z.infer<typeof environmentSchema>) => {
    try {
      const res = await mutation.mutateAsync({
        params: { path: { projectID: projectId } },
        body: values,
      });

      if (res) {
        toaster.create({
          title: t("environments.new.success"),
          description: t("environments.new.success_description"),
          type: "success",
          duration: 5000,
        });

        // If coming from test plan creation, redirect back to it
        if (from === "test-plan-creation") {
          navigate({
            to: "/projects/$projectId/test-plans/new",
            params: { projectId },
          });
        } else {
          navigate({
            to: "/projects/$projectId/environments",
            params: { projectId },
          });
        }
      }
    } catch {
      toaster.create({
        title: t("environments.new.error"),
        description: t("environments.new.error_description"),
        type: "error",
        duration: 3000,
      });
    }
  };

  return (
    <Box>
      <Heading size="lg" mb={4}>
        {t("environments.new.title")}
      </Heading>
      <DynamicForm
        schema={environmentSchema}
        fields={environmentFields}
        onSubmit={handleSubmit}
        submitText={t("environments.new.submit")}
        layout="vertical"
        spacing={4}
      />
    </Box>
  );
}
