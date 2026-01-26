import {apiClient} from "@/lib/api/query";
import { components } from "@/lib/api/v1";

type ChangePasswordRequest = components["schemas"]["schema.ChangePasswordRequest"];

export async function login(email: string, password: string) {
  return apiClient.request("post", "/v1/auth/login", {
    body: { email, password },
  });
}

export async function changePassword(request: ChangePasswordRequest) {
  return apiClient.request("post", "/v1/auth/change-password", {
    body: request,
  });
}