import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Container, Flex } from "@chakra-ui/react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import AppSidebar from "@/components/app-sidebar";
import { ColorModeButton } from "@/components/ui/color-mode";
import { MainLinkItems } from "@/lib/navigation";

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
    <SidebarProvider>
      <AppSidebar items={MainLinkItems}/>
      <SidebarInset className="flex min-h-screen flex-col items-center justify-between p-24">
        <Flex width={"100%"} padding={4} justifyContent="space-between">
          <SidebarTrigger />
          <ColorModeButton />
        </Flex>
        <Container>
          <Outlet />
        </Container>
      </SidebarInset>
    </SidebarProvider>
  );
}

