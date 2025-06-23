import { sleep } from "@/lib/utils";
import $api from "@/lib/api/query";
import * as React from "react";
import { LoginFormValues } from "@/data/forms/login";
import type { components } from "@/lib/api/v1";

export interface AuthContext {
  isAuthenticated: boolean;
  login: (data: LoginFormValues) => Promise<void>;
  logout: () => Promise<void>;
  user: string | null;
}

export const AuthContext = React.createContext<AuthContext | null>(null);

const key = "auth.user_id";

function getStoredUser() {
  return localStorage.getItem(key);
}

function setStoredUser(user: string | null) {
  if (user) {
    localStorage.setItem(key, user);
  } else {
    localStorage.removeItem(key);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<string | null>(getStoredUser());
  const isAuthenticated = !!user;

  const logout = React.useCallback(async () => {
    localStorage.removeItem("auth.user_id");
    localStorage.removeItem("auth.displayName");
    localStorage.removeItem("auth.token");
    localStorage.removeItem("auth.expires_at");
    localStorage.removeItem("auth.email");
    setStoredUser(null);
    setUser(null);
    await sleep(1);
  }, []);

  const loginMutation = $api.useMutation("post", "/v1/auth/login");

  const login = React.useCallback(async (data: LoginFormValues) => {
    const { mutateAsync } = loginMutation;
    const res = await mutateAsync({
      body: {
        email: data.email,
        password: data.password,
      },
    });
    if (!res) {
      throw new Error("Something happened while logging in..");
    }
    const loginData = res as components["schemas"]["schema.LoginResponse"];
    if (!loginData.user_id || !loginData.token || !loginData.displayName || !loginData.email || !loginData.expires_at) {
      throw new Error("Login response missing required fields");
    }
    localStorage.setItem("auth.user_id", `${loginData.user_id}`);
    localStorage.setItem("auth.displayName", loginData.displayName);
    localStorage.setItem("auth.email", loginData.email);
    localStorage.setItem("auth.token", loginData.token);
    localStorage.setItem("auth.expires_at", loginData.expires_at.toString());
    setStoredUser(loginData.displayName);
    setUser(loginData.displayName);
  }, [loginMutation]);

  React.useEffect(() => {
    setUser(getStoredUser());
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
