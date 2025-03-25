import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({ component: () => <Layout /> });

const Layout = () => {
  return (
    <>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  );
};
