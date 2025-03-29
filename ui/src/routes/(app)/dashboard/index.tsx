import { IconDashboard } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/dashboard/")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div>
      <h1>
        <IconDashboard /> Dashboard
      </h1>
    </div>
  );
}
