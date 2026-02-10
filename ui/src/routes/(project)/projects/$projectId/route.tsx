import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import {
  Alert,
  Box,
  Flex,
  Heading,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import AppSidebar from "@/components/app-sidebar";
import { ColorModeButton } from "@/components/ui/color-mode";
import { NavItem } from "@/lib/navigation";
import {
  FiBarChart2,
  FiClipboard,
  FiGitBranch,
  FiHome,
  FiInbox,
  FiSettings,
  FiUsers,
} from "react-icons/fi";
import { MdInsights } from "react-icons/md";
import { useProjectQuery } from "@/services/ProjectService";

export const Route = createFileRoute("/(project)/projects/$projectId")({
  component: RouteComponent,
});

const createProjectNavItems = (projectId: string): NavItem[] => {
  return [
    { path: `/projects/${projectId}`, name: "Overview", icon: FiHome },
    {
      path: `/projects/${projectId}/Features`,
      name: "Features and Modules",
      icon: FiGitBranch,
    },
    {
      path: `/projects/${projectId}/test-plans`,
      name: "Test Plans",
      icon: FiInbox,
    },
    {
      path: `/projects/${projectId}/test-cases`,
      name: "Test Cases",
      icon: FiClipboard,
    },
    {
      path: `/projects/${projectId}/testers`,
      name: "Testers",
      icon: FiUsers,
    },
    {
      path: `/projects/${projectId}/reports`,
      name: "Reports",
      icon: FiBarChart2,
    },
    {
      path: `/projects/${projectId}/insights`,
      name: "Insights",
      icon: MdInsights,
    },
    {
      path: `/projects/${projectId}/settings`,
      name: "Settings",
      icon: FiSettings,
    },
  ];
};

function RouteComponent() {
  const { projectId } = Route.useParams();
  const { data: project, isLoading, error } = useProjectQuery(projectId!);

  if (isLoading) return <Spinner color="brand.solid" />;
  if (error) {
    return (
      <Box>
        <Alert.Root colorPalette="danger" variant="outline">
          <Alert.Content>Failed to load Project information</Alert.Content>
        </Alert.Root>
      </Box>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar
        items={createProjectNavItems(projectId)}
        variant="inset"
        header={
          <Flex direction="column" gap="1">
            <Link to="/projects">
              <Text fontSize="xs" color="fg.subtle">
                &lt; Back to projects
              </Text>
            </Link>
            <Text fontSize="sm" fontWeight="semibold" color="fg.heading" noOfLines={1}>
              {project?.title}
            </Text>
          </Flex>
        }
      />
      <SidebarInset variant="inset">
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
          >
            <Flex alignItems="center" gap="2" flex="1">
              <SidebarTrigger />
            </Flex>
            <ColorModeButton />
          </Box>
          <Box
            flex="1"
            display="flex"
            flexDirection="column"
            overflowY="auto"
            bg="bg.canvas"
            px={{ base: "4", md: "6" }}
            py={{ base: "6", md: "8" }}
          >
            <Box w="full" maxW="6xl" mr="auto">
              <VStack borderBottom="sm" borderColor="border.subtle">
                <Heading size="3xl" color="fg.heading">
                  {project?.title}
                </Heading>
                <Text p="2" color="fg.muted">
                  {project?.description}
                </Text>
              </VStack>
              <Outlet />
            </Box>
          </Box>
        </Box>
      </SidebarInset>
    </SidebarProvider>
  );
}
