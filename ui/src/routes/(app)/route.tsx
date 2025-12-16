import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Box, Flex, Separator } from "@chakra-ui/react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import AppSidebar from "@/components/app-sidebar";
import { ColorModeButton } from "@/components/ui/color-mode";
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
      <AppSidebar items={MainLinkItems}/>
      <SidebarInset>
        <Box
          as="header"
          h="16"
          display="flex"
          alignItems="center"
          gap="2"
          px="4"
          borderBottom="1px solid"
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
          <ColorModeButton />
        </Box>
        <Box flex="1" display="flex" flexDirection="column" overflowY="auto">
          <Outlet />
        </Box>
      </SidebarInset>
    </SidebarProvider>
  );
}

