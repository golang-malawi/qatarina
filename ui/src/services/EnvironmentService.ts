import { apiClient } from "@/lib/api/query";
import $api from "@/lib/api/query";
import { components } from "@/lib/api/v1";

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

export async function getEnvironment(envID: string) {
  return apiClient.request("get", "/v1/environments/{envID}", {
    params: { path: { envID } },
  });
}

export function useCreateEnvironmentMutation(){
  return $api.useMutation("post", "/v1/projects/{projectID}/environments");
}

export async function createEnvironment(
  projectID: string, 
  data: components["schemas"]["schema.EnvironmentRequest"]
){
  return apiClient.request("post", "/v1/projects/{projectID}/environments", {
    params: {path:{projectID}},
    body: data,
  });

}

export function useUpdateEnvironmentMutation() {
  return $api.useMutation(
    "post",
    "/v1/projects/{projectID}/environments/{environmentID}"
  );
}

export function useDeleteEnvironmentMutation() {
  return $api.useMutation(
    "delete",
    "/v1/projects/{projectID}/environments/{environmentID}"
  );
}
