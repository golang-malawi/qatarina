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
import { Sidebar, SidebarTrigger, useSidebar } from "./ui/sidebar";
import { Logo } from "./logo";
import { Link } from "@tanstack/react-router";
import { SiteConfig } from "@/lib/config/site";
import { IconType } from "react-icons";
import { useState } from "react";
import React from "react";
import {
  FiChevronDown,
  FiChevronUp,
  FiHome,
  FiInbox,
  FiFolder,
  FiClipboard,
  FiUsers,
  FiLink,
  FiBarChart2,
  FiUser,
  FiLogOut,
} from "react-icons/fi";

interface NavItem {
  name: string;
  icon: IconType;
  path: string;
  children?: NavItem[];
}

interface NavLinkProps {
  item: NavItem;
  expanded: boolean;
  depth?: number;
}

const LinkItems: NavItem[] = [
  { path: "/dashboard", name: "Dashboard", icon: FiHome },
  { path: "/test-cases/inbox", name: "Inbox", icon: FiInbox },
  { path: "/projects", name: "Projects", icon: FiFolder },
  { path: "/test-plans", name: "Test Plans", icon: FiClipboard },
  { path: "/testers", name: "Testers", icon: FiUsers },
  { path: "/integrations", name: "Integrations", icon: FiLink },
  { path: "/reports", name: "Reports", icon: FiBarChart2 },
  { path: "/users", name: "Users", icon: FiUser },
  { path: "/logout", name: "Logout", icon: FiLogOut },
];

export default function AppSidebar() {
  return (
    <Sidebar header={<SidebarHeader />}>
      <SidebarContent />
    </Sidebar>
  );
}

const SidebarHeader = () => {
  const { isMobile } = useSidebar();
  return (
    <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Logo size="sm" />
        <Heading>{SiteConfig.name}</Heading>
      </Link>
      {isMobile && <SidebarTrigger />}
    </Flex>
  );
};

const NavLink: React.FC<NavLinkProps> = ({ item, expanded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <Collapsible.Root open={isOpen} onOpenChange={(d) => setIsOpen(d.open)}>
      <Collapsible.Trigger>
        <Flex
          as={"button"}
          align="center"
          mx="1"
          borderRadius="md"
          role="group"
          cursor="pointer"
          justifyContent="space-between"
          width="100%"
          textAlign="left"
        >
          <Flex align="center">
            {item.icon && (
              <Icon fontSize="16" as={item.icon} mr={expanded ? "3" : "0"} />
            )}
            {expanded && <Text>{item.name}</Text>}
          </Flex>

          {hasChildren && expanded && (
            <Icon as={isOpen ? FiChevronUp : FiChevronDown} fontSize="14" />
          )}
        </Flex>
      </Collapsible.Trigger>
      <Collapsible.Content>
        <VStack align="stretch" pl={2} mt={1}>
          {item.children!.map((child) => (
            <NavLinkItem key={child.path} item={child} />
          ))}
        </VStack>
      </Collapsible.Content>
    </Collapsible.Root>
  );
};

const NavLinkItem = ({ item }: { item: NavItem }) => {
  return (
    <Flex
      asChild
      align="center"
      mx="4"
      p="4"
      borderRadius="lg"
      role="group"
      cursor="pointer"
      width="100%"
      textAlign="left"
      _hover={{
        bg: "brand",
        color: "white",
      }}
    >
      <Link to={item.path}>
        {item.icon && (
          <Icon
            mr="4"
            fontSize="16"
            as={item.icon}
            _groupHover={{
              color: "white",
            }}
          />
        )}
        {item.name}
      </Link>
    </Flex>
  );
};

interface SidebarProps extends BoxProps {}

const SidebarContent = ({ ...rest }: SidebarProps) => {
  return (
    <Box borderRight="1px" w={"full"} h="full" {...rest}>
      {LinkItems.map((link) => {
        if (link.children) {
          return (
            <NavLink key={link.path} item={link} expanded={true} depth={1} />
          );
        }
        return <NavLinkItem key={link.path} item={link} />;
      })}
    </Box>
  );
};

