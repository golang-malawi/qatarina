import { Box, Heading, Spinner, Text, Stack, Button, Input, Flex } from "@chakra-ui/react";
import { useProjectQuery, useUpdateProjectMutation } from "@/services/ProjectService";
import { ArchiveControls } from "./ArchiveControls";
import { useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toaster } from "@/components/ui/toaster";
import { useQueryClient } from "@tanstack/react-query";

export function ProjectSettings({ projectId }: { projectId: string }) {
  const { data, isLoading, error } = useProjectQuery(projectId);
  const updateProjectMutation = useUpdateProjectMutation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [githubUrl, setGithubUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (data?.github_url) {
      setGithubUrl(data.github_url);
    }
  }, [data]);

  if (isLoading) return <Spinner size="xl" color="brand.solid" />;
  if (error) return <Text color="fg.error">Error loading project</Text>;
  if (!data) return <Text color="fg.muted">No project found</Text>;

  const isActive = data.is_active ?? true;

  const handleSaveGitHubUrl = async () => {
    if (!githubUrl.trim()) {
      toaster.create({
        title: "GitHub URL cleared",
        description: "GitHub URL has been removed from project settings",
        type: "info",
      });
      return;
    }

    try {
      setIsSaving(true);
      await updateProjectMutation.mutateAsync({
        params: { path: { projectID: projectId } },
        body: {
          id: data.id ?? Number(projectId),
          project_owner_id: data.owner_user_id ?? 0,
          name: data.title ?? "",
          code: data.code ?? "",
          description: data.description ?? "",
          version: data.version ?? "",
          website_url: data.website_url ?? "",
          github_url: githubUrl,
          parent_project_id: data.parent_project_id ?? 0,
          environments: [],
        },
      });
      // Invalidate and refetch project query to sync with backend
      await queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toaster.create({
        title: "GitHub URL saved",
        description: "GitHub URL has been updated successfully",
        type: "success",
      });
    } catch (err) {
      toaster.create({
        title: "Failed to save GitHub URL",
        description: "Could not update GitHub URL. Please try again.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTemplate = () => {
    navigate({ to: `/projects/${projectId}/settings/TestCaseTemplate` });
  };

  return (
    <Box p={6}>
      <Heading size="lg" mb={6}>Project Settings</Heading>
      <Stack gap={8} divideY="1px" borderColor="gray.200">
        <Box>
          <Heading size="md" mb={2}>GitHub Repository URL</Heading>
          <Text mb={4} color="gray.600">
            Add your GitHub repository URL to enable quick imports from issues and pull requests.
          </Text>
          <Flex gap={2} direction="column">
            <Input
              placeholder="https://github.com/owner/repo"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              disabled={isSaving}
            />
            <Text fontSize="sm" color="gray.500">
              When set, the GitHub import dialog will automatically load this repository.
            </Text>
            <Flex gap={2}>
              <Button
                onClick={handleSaveGitHubUrl}
                colorScheme="blue"
                disabled={isSaving}
                loading={isSaving}
              >
                Save GitHub URL
              </Button>
              {data?.github_url && (
                <Button
                  onClick={() => {
                    setGithubUrl("");
                    handleSaveGitHubUrl();
                  }}
                  variant="outline"
                  disabled={isSaving}
                >
                  Clear
                </Button>
              )}
            </Flex>
          </Flex>
        </Box>

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
