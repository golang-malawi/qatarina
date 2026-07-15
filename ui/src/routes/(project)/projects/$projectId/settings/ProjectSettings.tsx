import { Box, Heading, Spinner, Text, Stack, Button } from "@chakra-ui/react";
import { useProjectQuery } from "@/services/ProjectService";
import { ArchiveControls } from "./ArchiveControls";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export function ProjectSettings({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  const { data, isLoading, error } = useProjectQuery(projectId);
  const navigate = useNavigate();

  if (isLoading) return <Spinner size="xl" color="brand.solid" />;
  if (error) return <Text color="fg.error">{t("projects.settings.error_loading")}</Text>;
  if (!data) return <Text color="fg.muted">{t("projects.settings.no_project")}</Text>;

  const isActive = data.is_active ?? true;

  const handleAddTemplate = () => {
    navigate({ to: `/projects/${projectId}/settings/TestCaseTemplate` });
  };

  return (
    <Box p={6}>
      <Heading size="lg" mb={6}>{t("projects.settings.title")}</Heading>

      <Stack gap={8} divideY="1px" borderColor="gray.200">
        <Box>
          <Heading size="md" mb={2}>{t("projects.settings.archive.title")}</Heading>
          <Text mb={4} color="gray.600">
            {t("projects.settings.archive.description")}
          </Text>
          <ArchiveControls projectId={projectId} isActive={isActive} />
        </Box>

        <Box>
          <Heading size="md" mb={2}>{t("projects.settings.template.title")}</Heading>
          <Text mb={4} color="gray.600">
            {t("projects.settings.template.description")}
          </Text>
          <Button onClick={handleAddTemplate} colorScheme="blue">
            {t("projects.settings.template.add_button")}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
