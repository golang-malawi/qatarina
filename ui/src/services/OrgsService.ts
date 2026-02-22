import { apiClient } from "@/lib/api/query";
import $api from "@/lib/api/query";
import type { components } from "@/lib/api/v1";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export type Org = components["schemas"]["schema.Org"];
export type CreateOrgRequest = components["schemas"]["schema.CreateOrgRequest"];
export type UpdateOrgRequest = components["schemas"]["schema.UpdateOrgRequest"];
export type OrgListResponse = components["schemas"]["schema.OrgListResponse"];

export function useCreateOrgMutation() {
  return $api.useMutation("post", "/v1/orgs");
}

export async function createOrg(data: CreateOrgRequest) {
  return apiClient.request("post", "/v1/orgs", {body: data});
}

export function useOrgsQuery() {
  return $api.useQuery("get", "/v1/orgs");
}

export function useGetOrgQuery(id: string) {
  return $api.useQuery("get", "/v1/orgs/{orgID}", {
    params: { path: { orgID: id } },
  });
}

export async function getOrgByID(id: string) {
  return apiClient.request("get", "/v1/orgs/{orgID}", {
    params: { path: { orgID: id } },
  });
}

export async function updateOrg(id: string, data: UpdateOrgRequest) {
  return apiClient.request("put", "/v1/orgs/{orgID}", {
    params: { path: { orgID: id } },
    body: data,
  });
}

export async function deleteOrg(id: string) {
  return apiClient.request("delete", "/v1/orgs/{orgID}", {
    params: { path: { orgID: id } },
  });
}

export function useUpdateOrgMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orgID, data }: { orgID: string; data: UpdateOrgRequest }) =>
      updateOrg(orgID, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orgs"] });
      queryClient.invalidateQueries({ queryKey: ["org", variables.orgID] });
    },
  });
}

export function useDeleteOrgMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orgID: string) => deleteOrg(orgID),
    onSuccess: (_data, orgID) => {
      queryClient.invalidateQueries({ queryKey: ["orgs"] });
      queryClient.invalidateQueries({ queryKey: ["org", orgID] });
    },
  });
}
