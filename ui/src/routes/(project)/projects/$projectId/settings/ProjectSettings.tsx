import { Box, Heading, Spinner, Text } from "@chakra-ui/react";
import { useProjectQuery } from "@/services/ProjectService";
import { ArchiveControls } from "./ArchiveControls";

export function ProjectSettings({ projectId }: { projectId: string }) {
  const { data, isLoading, error } = useProjectQuery(projectId);

  if (isLoading) return <Spinner size="xl" color="brand.solid" />;
  if (error) return <Text color="fg.error">Error loading project</Text>;
  if (!data) return <Text color="fg.muted">No project found</Text>;

  const isActive = data.is_active ?? true;

  return (
    <Box p={6}>
      <Heading size="lg" mb={4}>Project Settings</Heading>
      <ArchiveControls projectId={projectId} isActive={isActive} />
    </Box>
  );
}
