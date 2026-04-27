import { createFileRoute } from "@tanstack/react-router";
import { ProjectSettings } from "./ProjectSettings";

export const Route = createFileRoute("/(project)/projects/$projectId/settings/")({
  component: SettingsPage,
});

function SettingsPage() {
  const { projectId } = Route.useParams();
  return <ProjectSettings projectId={projectId} />;
}
