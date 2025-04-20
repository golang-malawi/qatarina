import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { Box, Flex, Heading } from "@chakra-ui/react";
import Sidebar from "@/components/Sidebar";

export const Route = createFileRoute("/(app)")({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: BaseLayout,
});

function BaseLayout() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Box
        width={"100%"}
        bg={"gray.50"}
        borderBottom={"1px solid #f3f3f3"}
        padding={4}
      >
        <Link to="/">
          <Heading size="1xl">QATARINA </Heading>
        </Link>
      </Box>
      <Flex>
        <Box w="20%" borderRight={"1px solid rgba(200, 200, 200, 1)"} h="100vh">
          <Sidebar />
        </Box>
        <Box padding={4} w="80%">
          <Outlet />
        </Box>
      </Flex>
    </main>
  );
}
