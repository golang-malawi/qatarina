import { Box, Flex, HStack, IconButton, Separator } from "@chakra-ui/react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Tooltip } from "@/components/ui/tooltip";
import { FiInbox } from "react-icons/fi";
import { useLocation, useNavigate } from "@tanstack/react-router";

interface AppBarProps {
  showBreadcrumbs?: boolean;
}

export function AppBar({ showBreadcrumbs = true }: AppBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isInbox = location.pathname.startsWith("/workspace/test-cases/inbox");

  return (
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
      <Flex alignItems="center" gap="2" flex="1" minW="0">
        <SidebarTrigger />
        {showBreadcrumbs && (
          <>
            <Separator
              orientation="vertical"
              h="4"
              display={{ base: "none", md: "block" }}
            />
            <Breadcrumb />
          </>
        )}
      </Flex>
      <HStack gap="2">
        <Tooltip content="Inbox" positioning={{ placement: "bottom" }}>
          <IconButton
            aria-label="Open inbox"
            variant={isInbox ? "subtle" : "ghost"}
            colorPalette={isInbox ? "brand" : undefined}
            size="sm"
            onClick={() => navigate({ to: "/workspace/test-cases/inbox" })}
          >
            <FiInbox />
          </IconButton>
        </Tooltip>
      </HStack>
    </Box>
  );
}
