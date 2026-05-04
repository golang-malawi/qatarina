import { sleep } from "@/lib/utils";
import $api from "@/lib/api/query";
import * as React from "react";
import { LoginFormValues } from "@/data/forms/login";
import type { components } from "@/lib/api/v1";
import { getStoredUser, setStoredUser } from "./UserStorage";
import { AuthContext } from "./AuthContext";

type LoginResponse = components["schemas"]["schema.LoginResponse"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<LoginResponse | null>(getStoredUser());
  const isAuthenticated = !!user;

  const logout = React.useCallback(async () => {
    setStoredUser(null);
    setUser(null);
    await sleep(1);
  }, []);

  const loginMutation = $api.useMutation("post", "/v1/auth/login");

  const login = React.useCallback(
    async (data: LoginFormValues) => {
      const { mutateAsync } = loginMutation;
      try {
        const res = await mutateAsync({
          body: {
            email: data.email,
            password: data.password,
          },
        });
        if (!res) {
          throw new Error("Invalid email or password. Please try again.");
        }
        const loginData = res as components["schemas"]["schema.LoginResponse"];
        if (!loginData.user_id || !loginData.token) {
          throw new Error("Login response missing required fields");
        }
        
        setStoredUser(loginData);
        setUser(loginData);
      } catch (error: unknown) {
        console.log(error);
        let message = "Invalid email or password. Please try again.";
        if (
          typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof (error as { message?: unknown }).message === "string"
        ) {
          message = "Invalid email or password. Please try again.";
        }
        throw new Error(message);
      }
    },
    [loginMutation]
  );

  React.useEffect(() => {
    setUser(getStoredUser());
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

