import {apiClient} from "@/lib/api/query";
import { components } from "@/lib/api/v1";

type LoginResponse = components["schemas"]["schema.LoginResponse"];
type ChangePasswordRequest = components["schemas"]["schema.ChangePasswordRequest"];

export async function login(email: string, password: string) {
  const res = await apiClient.request("post", "/v1/auth/login", {
    body: { email, password },
  });
  return res.data as LoginResponse;
}

export async function changePassword(request: ChangePasswordRequest) {
  const res = await apiClient.request("post", "/v1/auth/change-password", {
    body: request,
  });

  if (!res.response.ok) {
    throw {
      response: res.response,
      data: res.data,
    };
  }
  
  return res.data;
  
}