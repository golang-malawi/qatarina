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