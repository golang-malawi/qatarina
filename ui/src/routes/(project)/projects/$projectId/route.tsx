import { createFileRoute } from "@tanstack/react-router";
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
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/(project)/projects/$projectId")({
  beforeLoad: requireAuth,
  component: RouteComponent,
});

const createProjectNavItems = (projectId: string, t: any): NavItem[] => {
  return [
    { path: `/projects/${projectId}`, name: t("projects.nav.overview"), icon: FiHome },
    {
      path: `/projects/${projectId}/Features`,
      name: t("projects.nav.features"),
      icon: FiGitBranch,
    },
    {
      path: `/projects/${projectId}/test-plans`,
      name: t("projects.nav.test_plans"),
      icon: FiInbox,
    },
    {
      path: `/projects/${projectId}/test-cases`,
      name: t("projects.nav.test_cases"),
      icon: FiClipboard,
    },
    {
      path: `/projects/${projectId}/testers`,
      name: t("projects.nav.testers"),
      icon: FiUsers,
    },
    {
      path: `/projects/${projectId}/reports`,
      name: t("projects.nav.reports"),
      icon: FiBarChart2,
    },
    {
      path: `/projects/${projectId}/insights`,
      name: t("projects.nav.insights"),
      icon: MdInsights,
    },
    {
      path: `/projects/${projectId}/settings`,
      name: t("projects.nav.settings"),
      icon: FiSettings,
    },
  ];
};

function RouteComponent() {
  const { t } = useTranslation();
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
          <Alert.Content>{t("projects.error.load")}</Alert.Content>
        </Alert.Root>
      </Box>
    );
  }

  return (
    <AppShell
      sidebarItems={createProjectNavItems(projectId, t)}
      sidebarHeader={
        <Flex direction="column" gap="1">
          <Text fontSize="sm" fontWeight="semibold" color="fg.heading">
            {project?.title}
          </Text>
        </Flex>
      }
    />
  );
}
