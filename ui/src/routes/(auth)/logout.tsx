import { useAuth } from "@/hooks/isLoggedIn";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/(auth)/logout")({
  component: Logout,
});

function Logout() {
  const router = useRouter();
  const navigate = Route.useNavigate();
  const auth = useAuth();

  useEffect(() => {
    auth.logout().then(() => {
      router.invalidate().finally(() => {
        navigate({ to: "/" });
      });
    });
  }, [auth, navigate, router]);

  return <></>;
}
