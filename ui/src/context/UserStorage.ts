import type { components } from "@/lib/api/v1";

type LoginResponse = components["schemas"]["schema.LoginResponse"];
const key = "auth.user";

export function getStoredUser(): LoginResponse | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user: LoginResponse | null) {
  if (user) {
    localStorage.setItem(key, JSON.stringify(user));
  } else {
    localStorage.removeItem(key);
  }
}