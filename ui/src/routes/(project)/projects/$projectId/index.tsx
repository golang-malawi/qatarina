import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(project)/projects/$projectId/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/projects/$projectId/overview",
      params: { projectId: params.projectId },
    });
  },
});