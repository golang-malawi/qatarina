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
}: {
  items: NavItem[];
  header?: ReactNode;
}) {
  return (
    <Sidebar header={<SidebarHeader />}>
      <SidebarContent items={items} header={header} />
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

interface SidebarProps extends BoxProps {
  items: NavItem[];
  header?: ReactNode;
}

const SidebarContent = ({ items, header, ...rest }: SidebarProps) => {
  return (
    <Box borderRight="1px" w={"full"} h="full" {...rest}>
      {header}
      {items.map((link) => {
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

