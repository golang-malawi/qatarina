import { Box } from "@chakra-ui/react";
import { Outlet } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/app-sidebar";
import { AppBar } from "@/components/app-bar";
import type { NavItem } from "@/lib/navigation";
import type { ReactNode } from "react";

interface AppShellProps {
  sidebarItems: NavItem[];
  sidebarHeader?: ReactNode;
  sidebarVariant?: "default" | "inset";
  showBreadcrumbs?: boolean;
}

export function AppShell({
  sidebarItems,
  sidebarHeader,
  sidebarVariant = "inset",
  showBreadcrumbs = true,
}: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar
        items={sidebarItems}
        variant={sidebarVariant}
        header={sidebarHeader}
      />
      <SidebarInset variant={sidebarVariant}>
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
          <AppBar showBreadcrumbs={showBreadcrumbs} />
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
