import {
  createRootRouteWithContext,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryClient } from "@tanstack/react-query";
import { AuthContextType } from "@/context/AuthContext";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  auth: AuthContextType;
}>()({ component: () => <Layout /> });

const Layout = () => {
  return (
    <>
      <Outlet />
      <TanStackRouterDevtools />
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
};
