import { apiClient } from "@/lib/api/query";
import $api from "@/lib/api/query";
import type { components } from "@/lib/api/v1";

export type User = components["schemas"]["schema.User"];

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

export function useGetUserQuery(userID?: string, options?: { enabled?: boolean }) {
  return $api.useQuery("get", `/v1/users/{userID}`, { 
    params: { path: { userID: userID ?? "" } },
     ...options,
     });
}

export function useUpdateUserMutation() {
  return $api.useMutation("post", `/v1/users/{userID}`);
}

export function useInviteUserMutation(email: string) {
  return apiClient.request("post", `/v1/users/invite/{email}`, { params: { path: { email: email }}, body: {} });
}

export function deleteUserByID(userID: string) {
  return apiClient.request("delete", `/v1/users/{userID}`,  { params: { path: { userID } } });
}

export type ResetPasswordRequest =
  components["schemas"]["schema.ResetPasswordRequest"];

export async function resetUserPassword(data: ResetPasswordRequest) {
  const res = await apiClient.request("post", "/v1/auth/reset-password", {
    body: data,
  });

  if (res.error) {
    const detail =
      typeof res.error === "object" && (res.error as any)?.detail
        ? (res.error as any).detail
        : "Failed to reset password";
    throw new Error(detail);
  }

  return res.data as { message: string };
}