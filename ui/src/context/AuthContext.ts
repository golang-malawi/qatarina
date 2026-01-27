import * as React from "react";
import type { LoginFormValues } from "@/data/forms/login";
import type { components } from "@/lib/api/v1";

type LoginResponse = components["schemas"]["schema.LoginResponse"];

export interface AuthContextType {
  isAuthenticated: boolean;
  login: (data: LoginFormValues) => Promise<void>;
  logout: () => Promise<void>;
  user: LoginResponse | null;
}

export const AuthContext = React.createContext<AuthContextType | null>(null);