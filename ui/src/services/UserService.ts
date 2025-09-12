import { apiClient } from "@/lib/api/query";
import $api from "@/lib/api/query";
import type { components } from "@/lib/api/v1";


export function useCreateUserMutation() {
  return $api.useMutation("post", "/v1/users");
}

export function useUsersQuery() {
  return $api.useQuery("get", "/v1/users");
}

export async function createUser(data: any) {
  return apiClient.request("post", "/v1/users", { body: data });
}

export function useSearchUsersQuery(params: Record<string, any>) {
  return $api.useQuery("get", "/v1/users/query", { params });
}

export function useGetUserQuery(userID: string) {
  return $api.useQuery("get", `/v1/users/{userID}`, { params: { path: { userID } } });
}

export function useUpdateUserMutation(userID: string, userData: components["schemas"]["schema.UpdateUserRequest"]) {
  return apiClient.request("post", `/v1/users/{userID}`,  { params: { path:  { userID } }, body: userData });
}

export function useInviteUserMutation(email: string) {
  return apiClient.request("post", `/v1/users/invite/{email}`, { params: { path: { email: email }}, body: {} });
}

export function deleteUserByID(userID: string) {
  return apiClient.request("delete", `/v1/users/{userID}`,  { params: { path: { userID } } });
}
