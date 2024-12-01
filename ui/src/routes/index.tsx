import { Heading } from "@chakra-ui/react";
import { useEffect } from "react";
import isLoggedIn from "../hooks/isLoggedIn";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const redirect = useNavigate();

  useEffect(() => {
    if (isLoggedIn()) {
      redirect({ to: "/dashboard" });
    }
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Heading size="1xl">QATARINA </Heading>
      <Link to="/login">Login</Link>
    </main>
  );
}

