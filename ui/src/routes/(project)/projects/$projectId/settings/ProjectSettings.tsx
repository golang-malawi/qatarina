import { Box, Heading, Spinner, Text, Stack, Button } from "@chakra-ui/react";
import { useProjectQuery } from "@/services/ProjectService";
import { ArchiveControls } from "./ArchiveControls";
import { useNavigate } from "@tanstack/react-router";

export function ProjectSettings({ projectId }: { projectId: string }) {
  const { data, isLoading, error } = useProjectQuery(projectId);
  const navigate = useNavigate();

  if (isLoading) return <Spinner size="xl" color="brand.solid" />;
  if (error) return <Text color="fg.error">Error loading project</Text>;
  if (!data) return <Text color="fg.muted">No project found</Text>;

  const isActive = data.is_active ?? true;

  const handleAddTemplate = () => {
    navigate({ to: `/projects/${projectId}/settings/TestCaseTemplate` });
  };

  return (
    <Box p={6}>
      <Heading size="lg" mb={6}>Project Settings</Heading>
      <Stack gap={8} divideY="1px" borderColor="gray.200">
        <Box>
          <Heading size="md" mb={2}>Archive Project</Heading>
          <Text mb={4} color="gray.600">
            Mark this project as inactive without deleting it.
          </Text>
          <ArchiveControls projectId={projectId} isActive={isActive} />
        </Box>

        <Box>
          <Heading size="md" mb={2}>Test Case Description Template</Heading>
          <Text mb={4} color="gray.600">
            Define a default description template to guide users when creating test cases.
          </Text>
          <Button onClick={handleAddTemplate} colorScheme="blue">
            Add Template
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
