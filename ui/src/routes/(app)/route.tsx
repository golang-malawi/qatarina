import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Box, Flex, Separator } from "@chakra-ui/react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import AppSidebar from "@/components/app-sidebar";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { MainLinkItems } from "@/lib/navigation";
import { ErrorComponent } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)")({
  beforeLoad: ({ context, location }) => {
    console.log("beforeLoad auth context:", context.auth);
    if (!context.auth?.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: BaseLayout,
  errorComponent: ({ error }) => <ErrorComponent error={error} />,
});

function BaseLayout() {
  return (
    <SidebarProvider>
      <AppSidebar items={MainLinkItems} variant="inset" />
      <SidebarInset variant="inset">
        <Box
          display="flex"
          flexDirection="column"
          flex="1"
          minH="full"
          bg="bg.surface"
          border="sm"
          borderColor="border.subtle"
          borderRadius="xl"
          shadow="sm"
          overflow="hidden"
        >
          <Box
            as="header"
            h="16"
            display="flex"
            alignItems="center"
            gap="2"
            px={{ base: "4", md: "6" }}
            bg="bg.surface"
            borderBottom="sm"
            borderColor="border.subtle"
            transition="height 200ms ease-linear"
          >
            <Flex alignItems="center" gap="2" flex="1">
              <SidebarTrigger />
              <Separator
                orientation="vertical"
                h="4"
                display={{ base: "none", md: "block" }}
              />
              <Breadcrumb />
            </Flex>
          </Box>
          <Box
            flex="1"
            display="flex"
            flexDirection="column"
            overflowY="auto"
            bg="bg.canvas"
            px={{ base: "4", md: "6" }}
            py={{ base: "6", md: "8" }}
          >
            <Outlet />
          </Box>
        </Box>
      </SidebarInset>
    </SidebarProvider>
  );
}
