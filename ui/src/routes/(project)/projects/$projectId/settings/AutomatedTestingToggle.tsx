import { Box, Heading, Text, Switch } from "@chakra-ui/react";
import { useUpdateAutomatedTestingMutation, useProjectQuery } from "@/services/ProjectService";
import { toaster } from "@/components/ui/toaster";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export function AutomatedTestingToggle({ projectId }: { projectId: string }) {
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
        title: "Project updated",
        description: `Automated testing has been ${checked ? "enabled" : "disabled"}.`,
      });
    } catch (err: any) {
      setEnabled(!checked);
      toaster.error({
        title: "Failed to update settings",
        description: err?.message || "Unexpected error",
      });
    }
  };

  return (
    <Box pt={4}>
      <Heading size="md" mb={2}>Automated Testing</Heading>
      <Text mb={4} color="gray.600">
        Allow users to attach script files and select runners when creating test cases.
      </Text>
      <Switch.Root checked={enabled} onCheckedChange={(d) => handleToggle(d.checked)}>
        <Switch.HiddenInput />
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Switch.Label ml={2}>
          {enabled ? "Enabled" : "Disabled"}
        </Switch.Label>
      </Switch.Root>
    </Box>
  );
}
