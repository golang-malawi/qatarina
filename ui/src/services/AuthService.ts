import { apiClient } from "@/lib/api/query";

export async function login(email: string, password: string) {
  return apiClient.request("post", "/v1/auth/login", {
    body: { email, password },
  });
}
