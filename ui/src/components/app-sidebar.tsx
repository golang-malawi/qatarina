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
  Portal,
  Separator,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Tooltip } from "./ui/tooltip";
import { Sidebar, useSidebar } from "./ui/sidebar";
import { Logo } from "./logo";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { SiteConfig } from "@/lib/config/site";
import React, { ReactNode, useMemo, useState } from "react";
import { FiChevronDown, FiChevronUp, FiHome } from "react-icons/fi";
import { LuChevronsUpDown, LuPlus, LuX } from "react-icons/lu";
import { NavItem } from "@/lib/navigation";
import { useQuery } from "@tanstack/react-query";
import { findProjectsQueryOptions } from "@/data/queries/projects";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "./ui/avatar";
import { THEME_OPTIONS, useColorMode } from "./ui/color-mode";

interface NavLinkProps {
  item: NavItem;
  expanded: boolean;
  depth?: number;
}

const PLATFORM_PATHS = new Set(["/workspace/dashboard"]);
const WORKSPACE_PATHS = new Set([
  "/workspace/projects",
  "/workspace/testers",
  "/workspace/users",
]);
const SYSTEM_PATHS = new Set(["/workspace/settings"]);
const HIDDEN_PATHS = new Set(["/logout"]);

export default function AppSidebar({
  items,
  header,
  variant = "default",
}: {
  items: NavItem[];
  header?: ReactNode;
  variant?: "default" | "inset";
}) {
  const { data: projectsData, isLoading: projectsLoading } = useQuery(
    findProjectsQueryOptions
  );
  const projects = projectsData?.projects ?? [];

  return (
    <Sidebar
      header={
        <SidebarHeader projects={projects} projectsLoading={projectsLoading} />
      }
      variant={variant}
    >
      <SidebarContent
        items={items}
        header={header}
      />
    </Sidebar>
  );
}

const SidebarHeader = ({
  projects,
  projectsLoading,
}: {
  projects: Array<{ id: number | string; title: string }>;
  projectsLoading: boolean;
}) => {
  const { isMobile, isCollapsed, toggleSidebar } = useSidebar();

  return (
    <Flex
      h="16"
      alignItems="center"
      px={isCollapsed ? "2" : "3"}
      justifyContent="space-between"
    >
      <ContextSwitcher
        collapsed={isCollapsed}
        projects={projects}
        projectsLoading={projectsLoading}
      />
      {isMobile && (
        <IconButton
          aria-label="Close sidebar"
          variant="ghost"
          size="sm"
          onClick={() => toggleSidebar()}
        >
          <LuX />
        </IconButton>
      )}
    </Flex>
  );
};

const ContextSwitcher = ({
  collapsed,
  projects,
  projectsLoading,
}: {
  collapsed: boolean;
  projects: Array<{ id: number | string; title: string }>;
  projectsLoading: boolean;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useSidebar();
  const projectMatch = location.pathname.match(/^\/projects\/([^/]+)/);
  const activeProjectId = projectMatch?.[1];
  const activeProject = activeProjectId
    ? projects.find((project) => String(project.id) === activeProjectId)
    : undefined;
  const isWorkspaceActive = !activeProjectId;
  const title = activeProject?.title ?? SiteConfig.name;
  const subtitle = activeProject ? "Team" : SiteConfig.subtitle;
  const teamList = projects.slice(0, 8);
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "T";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };
  const positioning = React.useMemo(
    () => ({
      placement: isMobile ? "bottom-start" : "right-start",
      gutter: 8,
      overflowPadding: 8,
      flip: true,
      shift: true,
      strategy: "fixed",
    }),
    [isMobile]
  );
  return (
    <Menu.Root positioning={positioning as any}>
      <Menu.Trigger asChild>
        <Box
          as="button"
          cursor="pointer"
          w="full"
          textAlign="left"
          px={collapsed ? "2" : "3"}
          py="2"
          borderRadius="md"
          role="group"
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
                  {title}
                </Text>
                <Text
                  fontSize="xs"
                  color="fg.subtle"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                >
                  {subtitle}
                </Text>
              </Box>
            )}
            {!collapsed && <Icon as={LuChevronsUpDown} color="fg.subtle" />}
          </HStack>
        </Box>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner zIndex="3000">
          <Menu.Content
            bg="bg.surface"
            border="sm"
            borderColor="border.subtle"
            minW="64"
            p="2"
            zIndex="3001"
          >
            <Text
              fontSize="xs"
              letterSpacing="wide"
              textTransform="uppercase"
              color="fg.subtle"
              px="2"
              pt="1"
              pb="2"
            >
              Workspace
            </Text>
            <Stack gap="1">
              <Menu.Item
                value="workspace-home"
                onClick={() => navigate({ to: "/workspace/dashboard" })}
                borderRadius="md"
                bg={isWorkspaceActive ? "bg.subtle" : "transparent"}
              >
                <HStack w="full" justify="space-between" gap="4" minW="0">
                  <HStack gap="3" minW="0">
                    <Box
                      w="7"
                      h="7"
                      borderRadius="md"
                      bg="bg.subtle"
                      border="sm"
                      borderColor="border.subtle"
                      display="grid"
                      placeItems="center"
                    >
                      <Icon as={FiHome} fontSize="16" color="fg.subtle" />
                    </Box>
                    <Text
                      fontSize="sm"
                      fontWeight={isWorkspaceActive ? "semibold" : "medium"}
                      color="fg.heading"
                      whiteSpace="nowrap"
                      overflow="hidden"
                      textOverflow="ellipsis"
                    >
                      Workspace home
                    </Text>
                  </HStack>
                </HStack>
              </Menu.Item>
            </Stack>
            <Box borderTop="sm" borderColor="border.subtle" my="2" />
            <Text
              fontSize="xs"
              letterSpacing="wide"
              textTransform="uppercase"
              color="fg.subtle"
              px="2"
              pt="1"
              pb="2"
            >
              Projects
            </Text>
            <Stack gap="1">
              {projectsLoading && (
                <Menu.Item value="loading" disabled>
                  Loading projects...
                </Menu.Item>
              )}
              {!projectsLoading && teamList.length === 0 && (
                <Menu.Item value="empty" disabled>
                  No projects yet
                </Menu.Item>
              )}
              {!projectsLoading &&
                teamList.map((project, index) => {
                  const isActive = activeProject?.id === project.id;
                  const initials = getInitials(project.title);
                  return (
                    <Menu.Item
                      key={project.id}
                      value={`project-${project.id}`}
                      onClick={() =>
                        navigate({ to: `/projects/${project.id}` })
                      }
                      borderRadius="md"
                      bg={isActive ? "bg.subtle" : "transparent"}
                    >
                      <HStack w="full" justify="space-between" gap="4" minW="0">
                        <HStack gap="3" minW="0">
                          <Box
                            w="7"
                            h="7"
                            borderRadius="md"
                            bg="bg.subtle"
                            border="sm"
                            borderColor="border.subtle"
                            display="grid"
                            placeItems="center"
                          >
                            <Text
                              fontSize="xs"
                              fontWeight="bold"
                              color="fg.subtle"
                            >
                              {initials}
                            </Text>
                          </Box>
                          <Text
                            fontSize="sm"
                            fontWeight={isActive ? "semibold" : "medium"}
                            color="fg.heading"
                            whiteSpace="nowrap"
                            overflow="hidden"
                            textOverflow="ellipsis"
                          >
                            {project.title}
                          </Text>
                        </HStack>
                        <Text fontSize="xs" color="fg.subtle">
                          #{index + 1}
                        </Text>
                      </HStack>
                    </Menu.Item>
                  );
                })}
            </Stack>
            <Box borderTop="sm" borderColor="border.subtle" my="2" />
            <Menu.Item
              value="add-team"
              onClick={() => navigate({ to: "/workspace/projects" })}
            >
              <HStack gap="2">
                <Icon as={LuPlus} color="fg.subtle" />
                <Text fontSize="sm">Manage projects</Text>
              </HStack>
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
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
    location.pathname === item.path ||
    location.pathname.startsWith(item.path + "/");

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

const SidebarContent = ({
  items,
  header,
  ...rest
}: SidebarProps) => {
  const { isCollapsed } = useSidebar();
  const visibleItems = useMemo(
    () => items.filter((item) => !HIDDEN_PATHS.has(item.path)),
    [items]
  );

  const groupedItems = useMemo(() => {
    const platform = visibleItems.filter((item) =>
      PLATFORM_PATHS.has(item.path)
    );
    const workspace = visibleItems.filter((item) =>
      WORKSPACE_PATHS.has(item.path)
    );
    const system = visibleItems.filter((item) => SYSTEM_PATHS.has(item.path));
    const assignedPaths = new Set([
      ...platform.map((item) => item.path),
      ...workspace.map((item) => item.path),
      ...system.map((item) => item.path),
    ]);
    const unassigned = visibleItems.filter(
      (item) => !assignedPaths.has(item.path)
    );
    const isProjectContext =
      unassigned.length > 0 &&
      unassigned.every((item) => item.path.startsWith("/projects/"));
    const unassignedLabel = isProjectContext ? "Project" : "Navigation";
    return {
      platform,
      workspace,
      system,
      unassigned,
      unassignedLabel,
      isProjectContext,
    };
  }, [visibleItems]);
  // Projects list intentionally removed from sidebar navigation

  return (
    <Box
      w="full"
      h="full"
      overflow="visible"
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
                  <NavLink
                    key={link.path}
                    item={link}
                    expanded={!isCollapsed}
                  />
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
                  <NavLink
                    key={link.path}
                    item={link}
                    expanded={!isCollapsed}
                  />
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
                  <NavLink
                    key={link.path}
                    item={link}
                    expanded={!isCollapsed}
                  />
                ) : (
                  <NavLinkItem key={link.path} item={link} />
                )
              )}
            </SidebarSection>
          )}

        </Stack>
      </Box>

      <Box px={isCollapsed ? "1" : "2"} pt="2" pb="2">
        {groupedItems.system.length > 0 && (
          <Box mb="2">
            {!isCollapsed && (
              <Text
                fontSize="xs"
                letterSpacing="wide"
                textTransform="uppercase"
                color="fg.subtle"
                px="2"
              >
                Settings
              </Text>
            )}
            <VStack align="stretch" gap="1" mt={isCollapsed ? "0" : "2"}>
              {groupedItems.system.map((link) => (
                <NavLinkItem key={link.path} item={link} />
              ))}
            </VStack>
          </Box>
        )}
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

// ProjectRow removed with sidebar projects list

const SidebarUser = ({ collapsed }: { collapsed: boolean }) => {
  const { isMobile } = useSidebar();
  const auth = useAuth();
  const { colorMode, setColorMode } = useColorMode();
  const displayName =
    auth.user?.displayName ||
    auth.user?.email ||
    auth.user?.user_id?.toString() ||
    "Signed in";
  const email = auth.user?.email ?? "";
  const userMenuPositioning = React.useMemo(
    () => ({
      placement: isMobile ? "top-start" : "right-end",
      gutter: 8,
      overflowPadding: 8,
      flip: true,
      shift: true,
      strategy: "fixed",
    }),
    [isMobile]
  );

  return (
    <HStack gap="2" w="full" align="center">
      <Menu.Root positioning={userMenuPositioning as any}>
        <Menu.Trigger asChild>
          <Button
            variant="ghost"
            size="sm"
            w="full"
            flex="1"
            minW="0"
            justifyContent={collapsed ? "center" : "flex-start"}
            px={collapsed ? "2" : "2"}
          >
            <HStack gap="3" w="full">
              <Avatar name={displayName} size="sm" bg="brand.solid" />
              {!collapsed && (
                <Box flex="1" minW="0">
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
        <Portal>
          <Menu.Positioner zIndex="3000">
            <Menu.Content
              bg="bg.surface"
              border="sm"
              borderColor="border.subtle"
              minW="56"
              p="2"
              zIndex="3001"
            >
              <Stack gap="1">
                <Menu.Item value="profile">Account settings</Menu.Item>
              </Stack>
              <Box borderTop="sm" borderColor="border.subtle" my="2" />
              <Text
                fontSize="xs"
                letterSpacing="wide"
                textTransform="uppercase"
                color="fg.subtle"
                px="2"
                pb="1"
              >
                Theme
              </Text>
              <Stack gap="1">
                {THEME_OPTIONS.map((theme) => {
                  const Icon = theme.icon;
                  const isActive = theme.value === colorMode;
                  return (
                    <Menu.Item
                      key={theme.value}
                      value={`theme-${theme.value}`}
                      onClick={() => setColorMode(theme.value)}
                    >
                      <HStack gap="3" w="full" justify="space-between">
                        <HStack gap="3" minW="0">
                          <Icon />
                          <Text fontSize="sm">{theme.label}</Text>
                        </HStack>
                        {isActive && (
                          <Text fontSize="xs" color="fg.subtle">
                            Active
                          </Text>
                        )}
                      </HStack>
                    </Menu.Item>
                  );
                })}
              </Stack>
              <Box borderTop="sm" borderColor="border.subtle" my="2" />
              <Menu.Item
                value="logout"
                onClick={() => {
                  auth.logout();
                }}
              >
                Sign out
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    </HStack>
  );
};
