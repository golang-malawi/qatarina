import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/(auth)/logout")({
  component: Logout,
});

function Logout() {
  const redirect = useNavigate();
  
  useEffect(() => {
    localStorage.removeItem("auth.user_id");
    localStorage.removeItem("auth.displayName");
    localStorage.removeItem("auth.token");
    redirect({ to: "/login" });
  }, [redirect]);

  return <></>;
}
