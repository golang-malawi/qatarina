import { createFileRoute, Link } from "@tanstack/react-router";
import { Box, Flex, Button, Heading, Text, Stack, Spinner } from "@chakra-ui/react";
import { useProjectQuery } from "@/services/ProjectService";
import { useTranslation } from "react-i18next";

// Route for the Overview page
export const Route = createFileRoute("/(project)/projects/$projectId/overview/")({
  component: ViewProject,
});

// Redirect route: when someone visits /projects/:projectId, send them to /overview
export const RedirectRoute = createFileRoute("/(project)/projects/$projectId")({
  beforeLoad: ({ params }) => {
    return { redirect: Route.to, params };
  },
});

function ViewProject() {
  const { t } = useTranslation();
  const { projectId } = Route.useParams();
  const { data: project, isLoading, error } = useProjectQuery(projectId!);

  if (isLoading) return <Spinner color="brand.solid" />;
  if (error) return <Text color="fg.error">{t("projects.overview.error")}</Text>;

  const navItems = [
    { label: t("projects.overview.nav.summary"), path: Route.to },
    { label: t("projects.overview.nav.test_cases"), path: "/projects/$projectId/test-cases" },
    { label: t("projects.overview.nav.test_plans"), path: "/projects/$projectId/test-plans" },
    { label: t("projects.overview.nav.features"), path: "/projects/$projectId/features" },
    { label: t("projects.overview.nav.testers"), path: "/projects/$projectId/testers" },
    { label: t("projects.overview.nav.reports"), path: "/projects/$projectId/reports" },
    { label: t("projects.overview.nav.insights"), path: "/projects/$projectId/insights" },
    { label: t("projects.overview.nav.settings"), path: "/projects/$projectId/settings" },
    { label: t("projects.overview.nav.environments"), path: "/projects/$projectId/environments" },
  ];

  return (
    <Box>
      <Flex
        gap="2"
        p={4}
        borderBottom="sm"
        borderColor="border.subtle"
        bg="bg.surface"
        overflowX="auto"
      >
        {navItems.map((item) => {
          const isActive = false; // TODO: use matchRoute for active state
          return (
            <Link key={item.label} to={item.path} params={{ projectId }}>
              <Button
                variant={isActive ? "solid" : "ghost"}
                colorPalette="brand"
                size="sm"
              >
                {item.label}
              </Button>
            </Link>
          );
        })}
      </Flex>

      <Box p={6}>
        <Heading size="lg" mb={4} color="fg.heading">
          {project?.title
            ? t("projects.overview.welcome_with_title", { title: project.title })
            : t("projects.overview.welcome_default")}
        </Heading>
        <Text mb={4} color="fg.subtle">
          {t("projects.overview.intro")}
        </Text>
        <Stack gap={3}>
          <Text>• {t("projects.overview.step.create_cases")}</Text>
          <Text>• {t("projects.overview.step.add_to_plan")}</Text>
          <Text>• {t("projects.overview.step.assign_users")}</Text>
          <Text>• {t("projects.overview.step.inbox")}</Text>
          <Text>• {t("projects.overview.step.record_results")}</Text>
          <Text>• {t("projects.overview.step.test_run")}</Text>
          <Text>• {t("projects.overview.step.view_runs")}</Text>
          <Text>• {t("projects.overview.step.close_runs")}</Text>
          <Text>• {t("projects.overview.step.close_plan")}</Text>
        </Stack>
        <Text mt={6} color="fg.muted">
          {t("projects.overview.help")}
        </Text>
      </Box>
    </Box>
  );
}
