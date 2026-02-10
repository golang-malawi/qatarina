import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ErrorComponent } from "@tanstack/react-router";
import { requireAuth } from "@/lib/auth/require-auth";

export const Route = createFileRoute("/(app)")({
  beforeLoad: requireAuth,
  component: AppLayout,
  errorComponent: ({ error }) => <ErrorComponent error={error} />,
});

function AppLayout() {
  return <Outlet />;
}
