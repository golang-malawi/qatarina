import { apiClient } from "@/lib/api/query";
import $api from "@/lib/api/query";

export function useTestersQuery() {
  return $api.useQuery("get", "/v1/testers");
}

export function useTesterQuery(testerID: string) {
  return $api.useQuery("get", "/v1/testers/{testerID}", {
    params: { path: { testerID } },
  });
}

export async function getTesters() {
  return apiClient.request("get", "/v1/testers");
}

export async function getTesterById(testerID: string) {
  return apiClient.request("get", "/v1/testers/{testerID}", {
    params: { path: { testerID } },
  });
}

export function useProjectTestersQuery(projectID: number) {
  return $api.useQuery("get", "/v1/projects/{projectID}/testers", {
    params: {path: {projectID}},
  });
}

export function useAssignTestersMutation() {
  return $api.useMutation("post", "/v1/projects/{projectID}/testers/assign");
}

export function useDeleteTesterMutation(){
  return $api.useMutation("delete", "/v1/testers/{testerID}");

} 