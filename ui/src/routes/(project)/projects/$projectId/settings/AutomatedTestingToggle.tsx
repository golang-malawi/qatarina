import { Box, Heading, Text, Switch } from "@chakra-ui/react";
import { useUpdateAutomatedTestingMutation, useProjectQuery } from "@/services/ProjectService";
import { toaster } from "@/components/ui/toaster";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

export function AutomatedTestingToggle({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data } = useProjectQuery(projectId);
  const updateMutation = useUpdateAutomatedTestingMutation();

  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (data) setEnabled(data.automated_testing_enabled ?? false);
  }, [data]);

  const handleToggle = async (checked: boolean) => {
    setEnabled(checked);
    try {
      await updateMutation.mutateAsync({
        params: { path: { projectID: Number(projectId) } },
        body: { automated_testing_enabled: checked },
      } as any);

      queryClient.invalidateQueries({ queryKey: ["projects", projectId] });

      toaster.success({
        title: t("projects.settings.automated_testing.success"),
        description: checked
          ? t("projects.settings.automated_testing.enabled")
          : t("projects.settings.automated_testing.disabled"),
      });
    } catch (err: any) {
      setEnabled(!checked);
      toaster.error({
        title: t("projects.settings.automated_testing.error"),
        description: err?.message || t("projects.update.error_description"),
      });
    }
  };

  return (
    <Box pt={4}>
      <Heading size="md" mb={2}>{t("projects.settings.automated_testing.title")}</Heading>
      <Text mb={4} color="gray.600">
        {t("projects.settings.automated_testing.description")}
      </Text>
      <Switch.Root checked={enabled} onCheckedChange={(d) => handleToggle(d.checked)}>
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
    </Box>
  );
}
