import { Button } from "@chakra-ui/react";
import { useArchiveProjectMutation, useUnarchiveProjectMutation } from "@/services/ProjectService";
import { toaster } from "@/components/ui/toaster";
import { useQueryClient } from "@tanstack/react-query";

export function ArchiveControls({ projectId, isActive = true }: { projectId: string; isActive?: boolean }) {
  const queryClient = useQueryClient();
  const archiveMutation = useArchiveProjectMutation();
  const unarchiveMutation = useUnarchiveProjectMutation();

  const handleArchive = async () => {
    try {
      await archiveMutation.mutateAsync({ params: { path: { projectID: Number(projectId) } } });
      queryClient.invalidateQueries({ queryKey: ["get", "/v1/projects"] });
      queryClient.invalidateQueries({ queryKey: ["get", "/v1/projects/{projectID}"] });
      toaster.success({ title: "Project archived successfully" });
    } catch (err: any) {
      toaster.error({ title: "Failed to archive project", description: err?.message });
    }
  };

  const handleUnarchive = async () => {
    try {
      await unarchiveMutation.mutateAsync({ params: { path: { projectID: Number(projectId) } } });
      queryClient.invalidateQueries({ queryKey: ["get", "/v1/projects"] });
      queryClient.invalidateQueries({ queryKey: ["get", "/v1/projects/{projectID}"] });
      toaster.success({ title: "Project unarchived successfully" });
    } catch (err: any) {
      toaster.error({ title: "Failed to unarchive project", description: err?.message });
    }
  };

  return isActive ? (
    <Button colorScheme="red" onClick={handleArchive}>Archive Project</Button>
  ) : (
    <Button colorScheme="green" onClick={handleUnarchive}>Unarchive Project</Button>
  );
}
