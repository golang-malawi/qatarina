import {
  Box,
  BoxProps,
  Collapsible,
  Flex,
  Heading,
  Icon,
  VStack,
  Text,
} from "@chakra-ui/react";
import { Tooltip } from "./ui/tooltip";
import { Sidebar, SidebarTrigger, useSidebar } from "./ui/sidebar";
import { Logo } from "./logo";
import { Link, useLocation } from "@tanstack/react-router";
import { SiteConfig } from "@/lib/config/site";
import { ReactNode, useState } from "react";
import React from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { NavItem } from "@/lib/navigation";

interface NavLinkProps {
  item: NavItem;
  expanded: boolean;
  depth?: number;
}

export default function AppSidebar({
  items,
  header,
  variant = "default",
}: {
  items: NavItem[];
  header?: ReactNode;
  variant?: "default" | "inset";
}) {
  return (
    <Sidebar header={<SidebarHeader />} variant={variant}>
      <SidebarContent items={items} header={header} />
    </Sidebar>
  );
}

const SidebarHeader = () => {
  const { isMobile, isCollapsed } = useSidebar();
  return (
    <Flex 
      h="16" 
      alignItems="center" 
      px={isCollapsed ? "2" : "4"} 
      justifyContent={isCollapsed ? "center" : "space-between"}
      borderBottom="sm"
      borderColor="border.subtle"
    >
      <Link 
        to="/" 
        style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: isCollapsed ? 0 : 12,
          width: isCollapsed ? "100%" : "auto",
          justifyContent: isCollapsed ? "center" : "flex-start",
        }}
      >
        <Logo size="sm" />
        {!isCollapsed && (
          <Heading
            size="md"
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
            color="fg.heading"
          >
            {SiteConfig.name}
          </Heading>
        )}
      </Link>
      {isMobile && <SidebarTrigger />}
    </Flex>
  );
};

const NavLink: React.FC<NavLinkProps> = ({ item, expanded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const { isCollapsed } = useSidebar();

  // Don't show collapsible content when sidebar is collapsed
  if (isCollapsed && hasChildren) {
    return (
      <Tooltip content={item.name} positioning={{ placement: "right" }}>
        <NavLinkItem item={item} />
      </Tooltip>
    );
  }

  return (
    <Collapsible.Root open={isOpen} onOpenChange={(d) => setIsOpen(d.open)}>
      <Collapsible.Trigger>
        <Flex
          as={"button"}
          align="center"
          mx="1"
          my="0.5"
          px={expanded ? "3" : "2"}
          py="2"
          borderRadius="md"
          role="group"
          cursor="pointer"
          justifyContent="space-between"
          width="100%"
          textAlign="left"
          _hover={{
            bg: "bg.subtle",
          }}
        >
          <Flex align="center" gap={expanded ? "3" : "0"}>
            {item.icon && (
              <Icon fontSize="16" as={item.icon} />
            )}
            {expanded && <Text fontSize="sm">{item.name}</Text>}
          </Flex>

          {hasChildren && expanded && (
            <Icon as={isOpen ? FiChevronUp : FiChevronDown} fontSize="14" />
          )}
        </Flex>
      </Collapsible.Trigger>
      {expanded && (
        <Collapsible.Content>
          <VStack align="stretch" pl={2} mt={1}>
            {item.children!.map((child) => (
              <NavLinkItem key={child.path} item={child} />
            ))}
          </VStack>
        </Collapsible.Content>
      )}
    </Collapsible.Root>
  );
};

const NavLinkItem = ({ item }: { item: NavItem }) => {
  const { isCollapsed } = useSidebar();
  const location = useLocation();
  const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
  
  const content = (
    <Flex
      asChild
      align="center"
      mx={isCollapsed ? "1" : "2"}
      px={isCollapsed ? "2" : "3"}
      py="2"
      borderRadius="md"
      role="group"
      cursor="pointer"
      width="100%"
      textAlign="left"
      justifyContent={isCollapsed ? "center" : "flex-start"}
      colorPalette={isActive ? "brand" : undefined}
      bg={isActive ? "colorPalette.solid" : "transparent"}
      color={isActive ? "colorPalette.fg" : "fg.muted"}
      _hover={{
        bg: isActive ? "colorPalette.solid" : "bg.subtle",
        color: isActive ? "colorPalette.fg" : "fg",
      }}
      transition="all 0.2s"
    >
      <Link to={item.path}>
        {item.icon && (
          <Icon
            fontSize="16"
            as={item.icon}
            mr={isCollapsed ? "0" : "3"}
            _groupHover={{
              color: isActive ? "colorPalette.fg" : "fg",
            }}
          />
        )}
        {!isCollapsed && (
          <Text fontSize="sm">{item.name}</Text>
        )}
      </Link>
    </Flex>
  );

  if (isCollapsed) {
    return (
      <Tooltip content={item.name} positioning={{ placement: "right" }}>
        {content}
      </Tooltip>
    );
  }

  return content;
};

interface SidebarProps extends BoxProps {
  items: NavItem[];
  header?: ReactNode;
}

const SidebarContent = ({ items, header, ...rest }: SidebarProps) => {
  const { isCollapsed } = useSidebar();
  return (
    <Box 
      w={"full"} 
      h="full" 
      overflowY="auto"
      py="2"
      {...rest}
    >
      {header}
      <VStack align="stretch" gap="1" px="1" mt="2">
        {items.map((link) => {
          if (link.children) {
            return (
              <NavLink key={link.path} item={link} expanded={!isCollapsed} depth={1} />
            );
          }
          return <NavLinkItem key={link.path} item={link} />;
        })}
      </VStack>
    </Box>
  );
};
