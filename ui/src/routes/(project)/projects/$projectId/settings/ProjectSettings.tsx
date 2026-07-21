import { Box, Heading, Spinner, Text, Stack, Button, Switch } from "@chakra-ui/react";
import { useProjectQuery, useUpdateAutomatedTestingMutation } from "@/services/ProjectService";
import { ArchiveControls } from "./ArchiveControls";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toaster } from "@/components/ui/toaster";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export function ProjectSettings({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useProjectQuery(projectId);
  const updateAutomatedTestingMutation = useUpdateAutomatedTestingMutation(); 
  const navigate = useNavigate();

  const [isAutomatedTestingEnabled, setIsAutomatedTestingEnabled] = useState(false);

  useEffect(() => {
    if (data) {
      setIsAutomatedTestingEnabled(data.automated_testing_enabled ?? false);
    }
  }, [data]);

  if (isLoading) return <Spinner size="xl" color="brand.solid" />;
  if (error) return <Text color="fg.error">{t("projects.settings.error_loading")}</Text>;
  if (!data) return <Text color="fg.muted">{t("projects.settings.no_project")}</Text>;

  const isActive = data.is_active ?? true;

  const handleToggleAutomatedTesting = async (checked: boolean) => {
    setIsAutomatedTestingEnabled(checked);

    try {
      // Corrected payload structure for OpenAPI-generated hooks
      await updateAutomatedTestingMutation.mutateAsync({
        params: {
          path: {
            projectID: Number(projectId),
          },
        },
        body: {
          automated_testing_enabled: checked,
        },
      } as any);

      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });

      toaster.create({
        title: "Project updated",
        description: `Automated testing has been ${checked ? "enabled" : "disabled"}.`,
        type: "success",
        duration: 3000,
      });
    } catch (err: any) {
      setIsAutomatedTestingEnabled(!checked);
      console.error("Failed to update automated testing:", err);
      
      toaster.create({
        title: "Failed to update settings",
        description: err?.body?.message || err?.message || "An unexpected error occurred.",
        type: "error",
        duration: 4000,
      });
    }
  };

  const handleAddTemplate = () => {
    navigate({ to: `/projects/${projectId}/settings/TestCaseTemplate` });
  };

  return (
    <Box p={6}>
      <Heading size="lg" mb={6}>{t("projects.settings.title")}</Heading>

      <Stack gap={8} divideY="1px" borderColor="gray.200">
        {/* Toggle Automated Testing Section */}
        <Box pt={4}>
          <Heading size="md" mb={2}>Automated Testing</Heading>
          <Text mb={4} color="gray.600">
            Allow users to attach script files and select runners when creating test cases.
          </Text>
          <Switch.Root
            checked={isAutomatedTestingEnabled}
            onCheckedChange={(details) => handleToggleAutomatedTesting(details.checked)}
          >
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Switch.Label ml={2}>
              {isAutomatedTestingEnabled ? "Enabled" : "Disabled"}
            </Switch.Label>
          </Switch.Root>
        </Box>

        <Box pt={4}>
          <Heading size="md" mb={2}>{t("projects.settings.archive.title")}</Heading>
          <Text mb={4} color="gray.600">
            {t("projects.settings.archive.description")}
          </Text>
          <ArchiveControls projectId={projectId} isActive={isActive} />
        </Box>

        <Box pt={4}>
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