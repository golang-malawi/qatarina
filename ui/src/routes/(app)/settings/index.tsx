import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/settings/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <h1>Settings</h1>
    </div>
  );
}
