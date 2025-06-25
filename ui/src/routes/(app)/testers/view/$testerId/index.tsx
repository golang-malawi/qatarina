import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/testers/view/$testerId/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/(app)/testers/views/$testerId/"!</div>;
}
