import { sleep } from "@/lib/utils";
import { AuthService } from "@/services/AuthService";
import axios from "axios";
import * as React from "react";
import { LoginFormValues } from "@/data/forms/login";

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

interface LoginData {
  user_id: number;
  token: string;
  email: string;
  displayName: string;
  expires_at: number;
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

    axios.defaults.withCredentials = false;
    axios.defaults.headers.common["Authorization"] = "";

    setStoredUser(null);
    setUser(null);

    await sleep(1);
  }, []);

  const login = React.useCallback(async (data: LoginFormValues) => {
    const authService = new AuthService();
    const res = await authService.login(data.email, data.password);

    if (res.status !== 200) {
      throw new Error("Something happened while logging in..");
    }
    const loginData: LoginData = res.data;

    localStorage.setItem("auth.user_id", `${loginData.user_id}`);
    localStorage.setItem("auth.displayName", loginData.displayName);
    localStorage.setItem("auth.email", loginData.email);
    localStorage.setItem("auth.token", loginData.token);
    localStorage.setItem("auth.expires_at", loginData.expires_at.toString());

    axios.defaults.withCredentials = false;
    axios.defaults.headers.common["Authorization"] =
      `Bearer ${loginData.token}`;

    setStoredUser(loginData.displayName);
    setUser(loginData.displayName);
  }, []);

  React.useEffect(() => {
    setUser(getStoredUser());
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
