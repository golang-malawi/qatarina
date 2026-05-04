import { createFileRoute } from "@tanstack/react-router";
import { ErrorComponent } from "@tanstack/react-router";
import { MainLinkItems } from "@/lib/navigation";
import { AppShell } from "@/components/app-shell";
import { requireAuth } from "@/lib/auth/require-auth";

export const Route = createFileRoute("/workspace")({
  beforeLoad: requireAuth,
  component: WorkspaceLayout,
  errorComponent: ({ error }) => <ErrorComponent error={error} />,
});

function WorkspaceLayout() {
  return <AppShell sidebarItems={MainLinkItems} />;
}
