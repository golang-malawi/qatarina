import { createFileRoute, Link } from "@tanstack/react-router";
import { Alert, Box, Flex, Spinner, Text } from "@chakra-ui/react";
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
import { AppShell } from "@/components/app-shell";
import { requireAuth } from "@/lib/auth/require-auth";
import { setLastProjectId } from "@/lib/last-project";
import { useEffect } from "react";

export const Route = createFileRoute("/(project)/projects/$projectId")({
  beforeLoad: requireAuth,
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

  useEffect(() => {
    if (projectId) {
      setLastProjectId(projectId);
    }
  }, [projectId]);

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
    <AppShell
      sidebarItems={createProjectNavItems(projectId)}
      sidebarHeader={
        <Flex direction="column" gap="1">
          <Text
            fontSize="sm"
            fontWeight="semibold"
            color="fg.heading"
            noOfLines={1}
          >
            {project?.title}
          </Text>
        </Flex>
      }
    />
  );
}
