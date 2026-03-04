import $api from "@/lib/api/query";

export const findEnvironmentsByProjectQueryOptions = (projectId: string | number) =>
  $api.queryOptions("get", "/v1/projects/{projectID}/environments", {
    params: { path: { projectID: String(projectId) } },
  });