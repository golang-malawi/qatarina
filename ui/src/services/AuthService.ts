import { apiClient } from "@/lib/api/query";
import { components } from "@/lib/api/v1";

type LoginResponse = components["schemas"]["schema.LoginResponse"];
type SignUpRequest = components["schemas"]["schema.SignUpRequest"];
type ChangePasswordRequest =
  components["schemas"]["schema.ChangePasswordRequest"];

/**
 * Thrown when an auth call gets a non-2xx response. Carries the HTTP status so
 * callers can react to specific cases (e.g. 409 = email already taken).
 */
export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

/** Pull a human-readable message out of an error body, if the API sent one. */
function messageFromBody(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const record = body as Record<string, unknown>;
  for (const key of ["message", "error"]) {
    const value = record[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
}

export async function login(email: string, password: string) {
  const res = await apiClient.request("post", "/v1/auth/login", {
    body: { email, password },
  });

  // Previously this returned res.data even on a 401, so a wrong password
  // "succeeded" with undefined data and nothing told the user.
  if (!res.response.ok) {
    const status = res.response.status;
    let message: string;
    if (status === 401) {
      // Deliberately doesn't say whether the email or the password was wrong.
      message = "Incorrect email or password.";
    } else if (status >= 500) {
      message = "Something went wrong on our side. Please try again shortly.";
    } else {
      message =
        messageFromBody(res.error ?? res.data) ??
        "Login failed. Please check your details and try again.";
    }
    throw new AuthError(message, status);
  }

  return res.data as LoginResponse;
}

export async function signUp(request: SignUpRequest) {
  const res = await apiClient.request("post", "/v1/auth/signup", {
    body: request,
  });

  if (!res.response.ok) {
    const status = res.response.status;
    const message =
      status >= 500
        ? "Something went wrong on our side. Please try again shortly."
        : (messageFromBody(res.error ?? res.data) ??
          "Could not create your account. Please check your details.");
    throw new AuthError(message, status);
  }

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