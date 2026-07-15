import { Button } from "@chakra-ui/react";
import { useArchiveProjectMutation, useUnarchiveProjectMutation } from "@/services/ProjectService";
import { toaster } from "@/components/ui/toaster";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

export function ArchiveControls({ projectId, isActive = true }: { projectId: string; isActive?: boolean }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const archiveMutation = useArchiveProjectMutation();
  const unarchiveMutation = useUnarchiveProjectMutation();

  const handleArchive = async () => {
    try {
      await archiveMutation.mutateAsync({ params: { path: { projectID: Number(projectId) } } });
      queryClient.invalidateQueries({ queryKey: ["get", "/v1/projects"] });
      queryClient.invalidateQueries({ queryKey: ["get", "/v1/projects/{projectID}"] });
      toaster.success({ title: t("projects.settings.archive.success") });
    } catch (err: any) {
      toaster.error({ title: t("projects.settings.archive.error"), description: err?.message });
    }
  };

  const handleUnarchive = async () => {
    try {
      await unarchiveMutation.mutateAsync({ params: { path: { projectID: Number(projectId) } } });
      queryClient.invalidateQueries({ queryKey: ["get", "/v1/projects"] });
      queryClient.invalidateQueries({ queryKey: ["get", "/v1/projects/{projectID}"] });
      toaster.success({ title: t("projects.settings.unarchive.success") });
    } catch (err: any) {
      toaster.error({ title: t("projects.settings.unarchive.error"), description: err?.message });
    }
  };

  return isActive ? (
    <Button colorScheme="red" onClick={handleArchive}>
      {t("projects.settings.archive_button")}
    </Button>
  ) : (
    <Button colorScheme="green" onClick={handleUnarchive}>
      {t("projects.settings.unarchive_button")}
    </Button>
  );
}
