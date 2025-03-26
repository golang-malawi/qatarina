import { Box, Button, Input, InputGroup, Link } from "@chakra-ui/react";
import { FormEvent, useState } from "react";
import {
  redirect,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { useAuth } from "@/hooks/isLoggedIn";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import React from "react";

const fallback = "/dashboard" as const;

export const Route = createFileRoute("/(auth)/login/")({
  validateSearch: z.object({
    redirect: z.string().optional().catch(""),
  }),
  beforeLoad: ({ context, search }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: search.redirect || fallback });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const auth = useAuth();
  const navigate = Route.useNavigate();
  const router = useRouter();
  const search = Route.useSearch();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isLoading = useRouterState({ select: (s) => s.isLoading });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    try {
      e.preventDefault();

      await auth.login(email, password);
      await router.invalidate();

      // TODO: 🥲 dies without this sleep because the context state is not refresing in time
      await sleep(1)

      await navigate({ to: search.redirect || fallback, replace: true });
      return false;
    } catch (error) {
      console.error("Error logging in: ", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLoggingIn = isLoading || isSubmitting;

  return (
    <div>
      <p className="text-3xl">QATARINA</p>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <Box>
          <InputGroup>
            <Input
              placeholder="E-mail"
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoggingIn}
            />
            <Input
              type="password"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoggingIn}
            />
          </InputGroup>
          <Button type="submit" disabled={isLoggingIn}>
            Login
          </Button>
        </Box>
      </form>
      <Link href="/forgot-password">Forgot Password?</Link>
    </div>
  );
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
