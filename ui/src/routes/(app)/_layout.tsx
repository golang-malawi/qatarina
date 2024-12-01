import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { Providers } from "../../lib/providers";
import { Box, Flex, Heading } from "@chakra-ui/react";
import Sidebar from "../../components/Sidebar";

export const Route = createFileRoute("/(app)/_layout")({
  component: LayoutComponent,
});

function LayoutComponent() {
  return (
    <Providers>
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
          <Box
            w="20%"
            borderRight={"1px solid rgba(200, 200, 200, 1)"}
            h="100vh"
          >
            <Sidebar />
          </Box>
          <Box padding={4}>
            <Outlet />
          </Box>
        </Flex>
      </main>
    </Providers>
  );
}

