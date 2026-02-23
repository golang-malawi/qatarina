import { redirect } from "@tanstack/react-router";
import type { AuthContextType } from "@/context/AuthContext";

interface RequireAuthArgs {
  context: { auth?: AuthContextType };
  location: { href: string };
}

export function requireAuth({ context, location }: RequireAuthArgs) {
  if (!context.auth?.isAuthenticated) {
    throw redirect({
      to: "/login",
      search: {
        redirect: location.href,
      },
    });
  }
}
