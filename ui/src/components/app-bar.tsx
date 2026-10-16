import {
  Badge,
  Box,
  Flex,
  Float,
  HStack,
  IconButton,
  Separator,
} from "@chakra-ui/react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Tooltip } from "@/components/ui/tooltip";
import { FiInbox } from "react-icons/fi";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { findInboxUnseenCountQueryOptions } from "@/data/queries/test-cases";

interface AppBarProps {
  showBreadcrumbs?: boolean;
}

export function AppBar({ showBreadcrumbs = true }: AppBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isInbox = location.pathname.startsWith("/workspace/test-cases/inbox");
  const { data: unseenCount = 0 } = useQuery(findInboxUnseenCountQueryOptions);
  const inboxLabel =
    unseenCount > 0 ? `Inbox (${unseenCount} unseen)` : "Inbox";

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
        <Tooltip content={inboxLabel} positioning={{ placement: "bottom" }}>
          <IconButton
            aria-label={`Open ${inboxLabel.toLowerCase()}`}
            position="relative"
            variant={isInbox ? "subtle" : "ghost"}
            colorPalette={isInbox ? "brand" : undefined}
            size="sm"
            onClick={() => navigate({ to: "/workspace/test-cases/inbox" })}
          >
            <FiInbox />
            {unseenCount > 0 && (
              <Float placement="top-end" offset="1">
                <Badge
                  size="xs"
                  variant="solid"
                  colorPalette="danger"
                  rounded="full"
                  minW="4"
                  justifyContent="center"
                >
                  {unseenCount > 99 ? "99+" : unseenCount}
                </Badge>
              </Float>
            )}
          </IconButton>
        </Tooltip>
      </HStack>
    </Box>
  );
}
