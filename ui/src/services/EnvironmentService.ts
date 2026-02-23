import { apiClient } from "@/lib/api/query";
import $api from "@/lib/api/query";

export function useProjectEnvironmentsQuery(projectID: string) {
  return $api.useQuery("get", "/v1/projects/{projectID}/environments", {
    params: { path: { projectID } },
  });
}

export async function getProjectEnvironments(projectID: string) {
  return apiClient.request("get", "/v1/projects/{projectID}/environments", {
    params: { path: { projectID } },
  });
}