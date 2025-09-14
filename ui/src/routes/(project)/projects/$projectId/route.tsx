import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import {
  Alert,
  Box,
  Container,
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

  if (isLoading) return <Spinner />;
  if (error) {
    return (
      <Box>
        <Alert.Root>
          <Alert.Content>Failed to load Project information</Alert.Content>
        </Alert.Root>
      </Box>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar
        items={createProjectNavItems(projectId)}
        header={
          <Flex direction="column">
            <Link to={`/projects`} className="flex flex-row">
              &lt; View All Projects
            </Link>
            <Text fontWeight="bold" textTransform="uppercase">
              {project?.title}
            </Text>
          </Flex>
        }
      />
      <SidebarInset className="flex min-h-screen flex-col items-center justify-between p-24">
        <Flex width={"100%"} padding={4} justifyContent="space-between">
          <SidebarTrigger />
          <ColorModeButton />
        </Flex>
        <Container>
          <VStack borderBottom="1px gray.500 solid">
            <Heading size="3xl">{project?.title}</Heading>
            <Text p={"2"}>{project?.description}</Text>
          </VStack>
          <Outlet />
        </Container>
      </SidebarInset>
    </SidebarProvider>
  );
}
