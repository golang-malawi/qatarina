import { createFileRoute } from "@tanstack/react-router";
import { Box, Button, Heading, Textarea, Text, Stack, Spinner } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useProjectTestCaseTemplateQuery, useAddProjectTestCaseTemplateMutation } from "@/services/ProjectService";
import { toaster } from "@/components/ui/toaster";
import { useTranslation } from "react-i18next";

function TestCaseTemplatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { projectId } = useParams({ from: "/(project)/projects/$projectId/settings/TestCaseTemplate" });
  const queryClient = useQueryClient();
  const projectID = Number(projectId);

  const { data, isLoading } = useProjectTestCaseTemplateQuery(projectID);
  const saveMutation = useAddProjectTestCaseTemplateMutation();
  const [template, setTemplate] = useState("");

  useEffect(() => {
    if (data) {
      setTemplate(data.test_case_template ?? "");
    }
  }, [data]);

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync({
        params: { path: { projectID } },
        body: {
          project_id: projectID,
          test_case_template: template,
        },
      });
      toaster.create({
        title: t("projects.settings.template.saved"),
        description: t("projects.settings.template.saved_description"),
        type: "success",
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ["projectTemplate", projectID] });
      navigate({ to: `/projects/${projectId}/settings` });
    } catch (err: any) {
      toaster.create({
        title: t("projects.settings.template.error"),
        description: err.message,
        type: "error",
        duration: 4000,
      });
    }
  };

  const handleCancel = () => {
    navigate({ to: `/projects/${projectId}/settings` });
  };

  if (isLoading) {
    return (
      <Box p={10}>
        <Spinner size="lg" />
        <Text mt={4}>{t("projects.settings.template.loading")}</Text>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Heading size="lg" mb={8}>
        {data?.test_case_template
          ? t("projects.settings.template.add_description_title")
          : t("projects.settings.template.add_title")}
      </Heading>

      <Stack gap={6}>
        <Textarea
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          placeholder={t("projects.settings.template.placeholder")}
          rows={16}
          width="100%"
        />

        <Box>
          <Button
            type="button"
            colorScheme="blue"
            mr={4}
            onClick={handleSave}
            loading={saveMutation.isPending}
          >
            {t("projects.settings.template.save_button")}
          </Button>
          <Button type="button" variant="outline" onClick={handleCancel}>
            {t("projects.settings.template.cancel_button")}
          </Button>
        </Box>

        <Text color="gray.500">
          {t("projects.settings.template.helper")}
        </Text>
      </Stack>
    </Box>
  );
}

export const Route = createFileRoute("/(project)/projects/$projectId/settings/TestCaseTemplate")({
  component: TestCaseTemplatePage,
});
