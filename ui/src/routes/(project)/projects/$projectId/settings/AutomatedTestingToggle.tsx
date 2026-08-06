import { Box, Heading, Text, Switch, VStack, Checkbox } from "@chakra-ui/react";
import { useUpdateAutomatedTestingMutation, useProjectQuery } from "@/services/ProjectService";
import { toaster } from "@/components/ui/toaster";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const RUNNER_OPTIONS = [
  { label: "Basi", value: "basi" },
  { label: "Playwright", value: "playwright" },
  { label: "Cypress", value: "cypress" },
  { label: "BrowserUse", value: "browseruse" },
];

export function AutomatedTestingToggle({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data } = useProjectQuery(projectId);
  const updateMutation = useUpdateAutomatedTestingMutation();

  const [enabled, setEnabled] = useState(false);
  const [selectedRunners, setSelectedRunners] = useState<string[]>(["basi"]);

  useEffect(() => {
    if (data) {
      setEnabled(data.automated_testing_enabled ?? false);
      if (data.supported_runners) {
        setSelectedRunners(data.supported_runners);
      }
    }
  }, [data]);

  const handleSave = async (newEnabled: boolean, newRunners: string[]) => {
    try {
      await updateMutation.mutateAsync({
        params: { path: { projectID: Number(projectId) } },
        body: { 
          project_id: Number(projectId),
          automated_testing_enabled: newEnabled, 
          supported_runners: newRunners 
        },
      } as any);

      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });

      toaster.success({
        title: t("projects.settings.automated_testing.success"),
        description: t("projects.settings.automated_testing.updated_desc"),
      });
    } catch (err: any) {
      toaster.error({
        title: t("projects.settings.automated_testing.error"),
        description: err?.message || t("projects.update.error_description"),
      });
    }
  };

  const handleToggleChange = (checked: boolean) => {
    setEnabled(checked);
    handleSave(checked, selectedRunners);
  };

  const handleRunnerCheckboxChange = (runnerValue: string, checked: boolean) => {
    let updatedRunners = [...selectedRunners];
    if (checked) {
      if (!updatedRunners.includes(runnerValue)) updatedRunners.push(runnerValue);
    } else {
      updatedRunners = updatedRunners.filter((r) => r !== runnerValue);
    }
    setSelectedRunners(updatedRunners);
    handleSave(enabled, updatedRunners);
  };

  return (
    <Box pt={4}>
      <Heading size="md" mb={2}>{t("projects.settings.automated_testing.title")}</Heading>
      <Text mb={4} color="gray.600">
        {t("projects.settings.automated_testing.description")}
      </Text>
      
      <Switch.Root checked={enabled} onCheckedChange={(d) => handleToggleChange(d.checked)} mb={4}>
        <Switch.HiddenInput />
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Switch.Label ml={2}>
          {enabled
            ? t("projects.settings.automated_testing.enabled")
            : t("projects.settings.automated_testing.disabled")}
        </Switch.Label>
      </Switch.Root>

      {enabled && (
        <Box pl={6} mt={3}>
          <Text fontWeight="medium" mb={2}>Supported Runners</Text>
          <VStack align="start" gap={2}>
            {RUNNER_OPTIONS.map((runner) => (
              <Checkbox.Root
                key={runner.value}
                checked={selectedRunners.includes(runner.value)}
                onCheckedChange={(e) => handleRunnerCheckboxChange(runner.value, !!e.checked)}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Checkbox.Label>{runner.label}</Checkbox.Label>
              </Checkbox.Root>
            ))}
          </VStack>
        </Box>
      )}
    </Box>
  );
}