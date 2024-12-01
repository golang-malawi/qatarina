import { Box, Button, Input, Link, Stack } from "@chakra-ui/react";
import axios from "axios";
import { FormEvent, useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import isLoggedIn from "@/hooks/isLoggedIn";
import { AuthService } from "@/services/AuthService";

export const Route = createFileRoute("/(auth)/login/")({
  component: LoginPage,
});

interface LoginData {
  user_id: number;
  token: string;
  displayName: string;
}

export default function LoginPage() {
  const redirect = useNavigate();

  useEffect(() => {
    if (isLoggedIn()) {
      redirect({ to: "/dashboard" });
    }
  }, []);

  const authService = new AuthService();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const res = await authService.login(email, password);

    if (res.status == 200) {
      const loginData: LoginData = res.data;
      localStorage.setItem("auth.user_id", `${loginData.user_id}`);
      localStorage.setItem("auth.displayName", loginData.displayName);
      localStorage.setItem("auth.token", loginData.token);

      axios.defaults.withCredentials = false;
      axios.defaults.headers.common["Authorization"] =
        `Bearer ${loginData.token}`;
      redirect({ to: "/dashboard" });
    }
    return false;
  }
  return (
    <div>
      <p className="text-3xl">QATARINA</p>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <Box>
          <Stack gap="4">
            <Input
              placeholder="E-mail"
              type="email"
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </Stack>
          <Button type="submit">Login</Button>
        </Box>
      </form>
      <Link href="/forgot-password">Forgot Password?</Link>
    </div>
  );
}
