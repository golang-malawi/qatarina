import {
  Box,
  BoxProps,
  Button,
  Collapsible,
  Flex,
  HStack,
  Icon,
  IconButton,
  Menu,
  Separator,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Tooltip } from "./ui/tooltip";
import { Sidebar, SidebarTrigger, useSidebar } from "./ui/sidebar";
import { Logo } from "./logo";
import { Link, useLocation } from "@tanstack/react-router";
import { SiteConfig } from "@/lib/config/site";
import React, { ReactNode, useMemo, useState } from "react";
import { FiChevronDown, FiChevronUp, FiMoreHorizontal } from "react-icons/fi";
import { LuChevronsUpDown } from "react-icons/lu";
import { NavItem } from "@/lib/navigation";
import { useQuery } from "@tanstack/react-query";
import { findProjectsQueryOptions } from "@/data/queries/projects";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "./ui/avatar";

interface NavLinkProps {
  item: NavItem;
  expanded: boolean;
  depth?: number;
}

const PLATFORM_PATHS = new Set(["/dashboard", "/test-cases/inbox"]);
const WORKSPACE_PATHS = new Set(["/projects", "/testers", "/users"]);
const SYSTEM_PATHS = new Set(["/settings", "/logout"]);

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
      px={isCollapsed ? "2" : "3"}
      justifyContent="space-between"
      borderBottom="sm"
      borderColor="border.subtle"
    >
      <TeamSwitcher collapsed={isCollapsed} />
      {isMobile && <SidebarTrigger />}
    </Flex>
  );
};

const TeamSwitcher = ({ collapsed }: { collapsed: boolean }) => {
  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button
          variant="ghost"
          size={collapsed ? "sm" : "md"}
          px={collapsed ? "2" : "2"}
          justifyContent="flex-start"
          w={collapsed ? "auto" : "full"}
        >
          <HStack gap={collapsed ? "0" : "3"} w="full">
            <Logo size="sm" />
            {!collapsed && (
              <Box flex="1" minW="0">
                <Text
                  fontWeight="semibold"
                  fontSize="sm"
                  color="fg.heading"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                >
                  {SiteConfig.name}
                </Text>
                <Text
                  fontSize="xs"
                  color="fg.subtle"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                >
                  {SiteConfig.subtitle}
                </Text>
              </Box>
            )}
            {!collapsed && <Icon as={LuChevronsUpDown} color="fg.subtle" />}
          </HStack>
        </Button>
      </Menu.Trigger>
      <Menu.Content bg="bg.surface" border="sm" borderColor="border.subtle">
        <Menu.Item value="primary">{SiteConfig.name}</Menu.Item>
        <Menu.Item value="analytics">Analytics Workspace</Menu.Item>
        <Menu.Item value="qa">QA Pipeline</Menu.Item>
      </Menu.Content>
    </Menu.Root>
  );
};

const NavLink: React.FC<NavLinkProps> = ({ item, expanded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const { isCollapsed } = useSidebar();

  if (isCollapsed && hasChildren) {
    return <NavLinkItem item={item} />;
  }

  return (
    <Collapsible.Root open={isOpen} onOpenChange={(d) => setIsOpen(d.open)}>
      <Collapsible.Trigger asChild>
        <Flex
          as="button"
          type="button"
          align="center"
          px={expanded ? "3" : "2"}
          py="2"
          borderRadius="md"
          role="group"
          cursor="pointer"
          justifyContent="space-between"
          width="100%"
          textAlign="left"
          _hover={{ bg: "bg.subtle" }}
        >
          <Flex align="center" gap={expanded ? "3" : "0"}>
            {item.icon && <Icon fontSize="16" as={item.icon} />}
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
  const isActive =
    location.pathname === item.path || location.pathname.startsWith(item.path + "/");

  const content = (
    <Flex
      asChild
      align="center"
      px={isCollapsed ? "2" : "3"}
      py="2"
      borderRadius="md"
      role="group"
      cursor="pointer"
      width="100%"
      textAlign="left"
      justifyContent={isCollapsed ? "center" : "flex-start"}
      bg={isActive ? "brand.subtle" : "transparent"}
      color={isActive ? "brand.fg" : "fg.muted"}
      _hover={{
        bg: isActive ? "brand.subtle" : "bg.subtle",
        color: isActive ? "brand.fg" : "fg",
      }}
      transition="all 0.2s"
    >
      <Link to={item.path}>
        {item.icon && (
          <Icon
            fontSize="16"
            as={item.icon}
            mr={isCollapsed ? "0" : "3"}
            _groupHover={{ color: isActive ? "brand.fg" : "fg" }}
          />
        )}
        {!isCollapsed && <Text fontSize="sm">{item.name}</Text>}
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
  const { data: projectsData, isLoading: projectsLoading } = useQuery(
    findProjectsQueryOptions
  );

  const groupedItems = useMemo(() => {
    const platform = items.filter((item) => PLATFORM_PATHS.has(item.path));
    const workspace = items.filter((item) => WORKSPACE_PATHS.has(item.path));
    const system = items.filter((item) => SYSTEM_PATHS.has(item.path));
    const assignedPaths = new Set([
      ...platform.map((item) => item.path),
      ...workspace.map((item) => item.path),
      ...system.map((item) => item.path),
    ]);
    const unassigned = items.filter((item) => !assignedPaths.has(item.path));
    const isProjectContext =
      unassigned.length > 0 &&
      unassigned.every((item) => item.path.startsWith("/projects/"));
    const unassignedLabel = isProjectContext ? "Project" : "Navigation";
    return { platform, workspace, system, unassigned, unassignedLabel };
  }, [items]);

  const projects = projectsData?.projects ?? [];
  const topProjects = projects.slice(0, 4);

  return (
    <Box
      w="full"
      h="full"
      overflow="hidden"
      py="2"
      display="flex"
      flexDirection="column"
      {...rest}
    >
      {header && !isCollapsed && (
        <Box px="3" pt="2" pb="2">
          {header}
        </Box>
      )}
      {header && !isCollapsed && (
        <Box px="2">
          <Separator borderColor="border.subtle" />
        </Box>
      )}

      <Box flex="1" overflowY="auto" px={isCollapsed ? "1" : "2"}>
        <Stack gap="4" mt="2">
          {groupedItems.platform.length > 0 && (
            <SidebarSection label="Platform" collapsed={isCollapsed}>
              {groupedItems.platform.map((link) =>
                link.children ? (
                  <NavLink key={link.path} item={link} expanded={!isCollapsed} />
                ) : (
                  <NavLinkItem key={link.path} item={link} />
                )
              )}
            </SidebarSection>
          )}

          {groupedItems.workspace.length > 0 && (
            <SidebarSection label="Workspace" collapsed={isCollapsed}>
              {groupedItems.workspace.map((link) =>
                link.children ? (
                  <NavLink key={link.path} item={link} expanded={!isCollapsed} />
                ) : (
                  <NavLinkItem key={link.path} item={link} />
                )
              )}
            </SidebarSection>
          )}

          {groupedItems.unassigned.length > 0 && (
            <SidebarSection
              label={groupedItems.unassignedLabel}
              collapsed={isCollapsed}
            >
              {groupedItems.unassigned.map((link) =>
                link.children ? (
                  <NavLink key={link.path} item={link} expanded={!isCollapsed} />
                ) : (
                  <NavLinkItem key={link.path} item={link} />
                )
              )}
            </SidebarSection>
          )}

          {!isCollapsed && (
            <SidebarSection label="Projects" collapsed={isCollapsed}>
              {projectsLoading && (
                <Text fontSize="xs" color="fg.subtle">
                  Loading projects...
                </Text>
              )}
              {!projectsLoading && topProjects.length === 0 && (
                <Text fontSize="xs" color="fg.subtle">
                  No projects yet.
                </Text>
              )}
              {topProjects.map((project) => (
                <ProjectRow
                  key={project.id}
                  name={project.title}
                  href={`/projects/${project.id}`}
                />
              ))}
              <Button
                asChild
                variant="ghost"
                size="sm"
                justifyContent="flex-start"
                color="fg.subtle"
              >
                <Link to="/projects">View all projects</Link>
              </Button>
            </SidebarSection>
          )}

          {groupedItems.system.length > 0 && (
            <SidebarSection label="System" collapsed={isCollapsed}>
              {groupedItems.system.map((link) => (
                <NavLinkItem key={link.path} item={link} />
              ))}
            </SidebarSection>
          )}
        </Stack>
      </Box>

      <Box px={isCollapsed ? "1" : "2"} pt="2" pb="2">
        <Separator borderColor="border.subtle" mb="2" />
        <SidebarUser collapsed={isCollapsed} />
      </Box>
    </Box>
  );
};

const SidebarSection = ({
  label,
  collapsed,
  children,
}: {
  label: string;
  collapsed: boolean;
  children: React.ReactNode;
}) => {
  return (
    <Box>
      {!collapsed && (
        <Text
          fontSize="xs"
          letterSpacing="wide"
          textTransform="uppercase"
          color="fg.subtle"
          px="2"
        >
          {label}
        </Text>
      )}
      <VStack align="stretch" gap="1" mt={collapsed ? "0" : "2"}>
        {children}
      </VStack>
    </Box>
  );
};

const ProjectRow = ({ name, href }: { name: string; href: string }) => {
  return (
    <Flex
      align="center"
      justify="space-between"
      px="2"
      py="1.5"
      borderRadius="md"
      role="group"
      _hover={{ bg: "bg.subtle" }}
    >
      <HStack asChild gap="2" flex="1" minW="0">
        <Link to={href}>
          <Box w="2" h="2" borderRadius="full" bg="brand.solid" />
          <Text
            fontSize="sm"
            color="fg.muted"
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
          >
            {name}
          </Text>
        </Link>
      </HStack>
      <IconButton
        aria-label="Project actions"
        size="xs"
        variant="ghost"
        opacity={0}
        _groupHover={{ opacity: 1 }}
      >
        <FiMoreHorizontal />
      </IconButton>
    </Flex>
  );
};

const SidebarUser = ({ collapsed }: { collapsed: boolean }) => {
  const auth = useAuth();
  const displayName =
    auth.user?.display_name ||
    auth.user?.email ||
    auth.user?.user_id?.toString() ||
    "Signed in";
  const email = auth.user?.email ?? "";

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button
          variant="ghost"
          size="sm"
          w="full"
          justifyContent={collapsed ? "center" : "flex-start"}
          px={collapsed ? "2" : "2"}
        >
          <HStack gap="3" w="full">
            <Avatar name={displayName} size="sm" bg="brand.solid" />
            {!collapsed && (
              <Box flex="1">
                <Text
                  fontSize="sm"
                  color="fg.heading"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                >
                  {displayName}
                </Text>
                <Text
                  fontSize="xs"
                  color="fg.subtle"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                >
                  {email}
                </Text>
              </Box>
            )}
            {!collapsed && <Icon as={LuChevronsUpDown} color="fg.subtle" />}
          </HStack>
        </Button>
      </Menu.Trigger>
      <Menu.Content bg="bg.surface" border="sm" borderColor="border.subtle">
        <Menu.Item value="profile">Account settings</Menu.Item>
        <Menu.Item
          value="logout"
          onClick={() => {
            auth.logout();
          }}
        >
          Sign out
        </Menu.Item>
      </Menu.Content>
    </Menu.Root>
  );
};
