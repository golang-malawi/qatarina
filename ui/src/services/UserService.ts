import { apiClient } from "@/lib/api/query";
import $api from "@/lib/api/query";

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
  return $api.useQuery("get", `/v1/users/${userID}`);
}

export function useUpdateUserMutation(userID: string) {
  return $api.useMutation("post", `/v1/users/${userID}`);
}

export function useInviteUserMutation(email: string) {
  return $api.useMutation("post", `/v1/users/invite/${email}`);
}

export function useDeleteUserMutation(userID: string) {
  return $api.useMutation("delete", `/v1/users/${userID}`);
}