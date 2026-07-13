import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Stack,
  Spinner,
  Text,
} from "@chakra-ui/react";
import {
  IconDashboard,
  IconListCheck,
  IconPlus,
  IconSettings,
  IconTable,
  IconUser,
} from "@tabler/icons-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MetricCard } from "@/components/ui/metric-card";
import $api from "@/lib/api/query";
import { useTranslation } from "react-i18next";

type QuickAction = {
  title: string;
  description: string;
  to:
    | "/workspace/projects/new"
    | "/workspace/testers/invite"
    | "/workspace/test-cases/inbox"
    | "/workspace/projects";
  action: string;
  icon: typeof IconPlus;
};

function DashboardPage() {
  const { t } = useTranslation();

  const { data, isPending, error } = useSuspenseQuery(
    $api.queryOptions("get", "/v1/dashboard/summary" as any, {})
  );

  if (isPending) return <Spinner size="xl" color="brand.solid" />;
  if (error) return <Text color="fg.error">{t("dashboard.error.load")}</Text>;

  const {
    project_count,
    tester_count,
    test_case_count,
    test_plan_count,
    closed_to_open_ratio,
    recent_projects,
  } = data;

  const recentProjects = Array.isArray(recent_projects) ? recent_projects : [];

  const formatValue = (value?: number) =>
    typeof value !== "number" ? t("common.not_available") : value.toLocaleString();

  const formatRatio = (value?: number) =>
    typeof value !== "number" ? t("common.not_available") : value.toFixed(2);

  const ratioValue = formatRatio(closed_to_open_ratio);
  const ratioHealth =
    typeof closed_to_open_ratio === "number"
      ? closed_to_open_ratio >= 1
        ? t("dashboard.performance.healthy")
        : t("dashboard.performance.attention")
      : t("dashboard.performance.no_data");

  const ratioDirection =
    typeof closed_to_open_ratio !== "number"
      ? "flat"
      : closed_to_open_ratio >= 1
      ? "up"
      : "down";

  const ratioTone =
    typeof closed_to_open_ratio !== "number"
      ? "neutral"
      : closed_to_open_ratio >= 1
      ? "success"
      : "warning";

  const quickActions: QuickAction[] = [
    {
      title: t("dashboard.quick_actions.create_project.title"),
      description: t("dashboard.quick_actions.create_project.description"),
      to: "/workspace/projects/new",
      action: t("dashboard.quick_actions.create_project.action"),
      icon: IconPlus,
    },
    {
      title: t("dashboard.quick_actions.invite_testers.title"),
      description: t("dashboard.quick_actions.invite_testers.description"),
      to: "/workspace/testers/invite",
      action: t("dashboard.quick_actions.invite_testers.action"),
      icon: IconUser,
    },
    {
      title: t("dashboard.quick_actions.review_inbox.title"),
      description: t("dashboard.quick_actions.review_inbox.description"),
      to: "/workspace/test-cases/inbox",
      action: t("dashboard.quick_actions.review_inbox.action"),
      icon: IconListCheck,
    },
    {
      title: t("dashboard.quick_actions.manage_projects.title"),
      description: t("dashboard.quick_actions.manage_projects.description"),
      to: "/workspace/projects",
      action: t("dashboard.quick_actions.manage_projects.action"),
      icon: IconSettings,
    },
  ];

  return (
    <Box w="full">
      {/* Overview */}
      <Card.Root border="sm" borderColor="border.subtle" bgGradient="linear(to-r, bg.surface, bg.subtle)" shadow="sm" mb={6}>
        <Card.Body p={{ base: 5, md: 7 }}>
          <Flex direction={{ base: "column", xl: "row" }} justify="space-between" gap={6}>
            <Stack gap={3} maxW="2xl">
              <Badge alignSelf="start" colorPalette="brand" variant="subtle">
                {t("dashboard.overview.badge")}
              </Badge>
              <Heading size="2xl" color="fg.heading">
                {t("dashboard.overview.title")}
              </Heading>
              <Text color="fg.muted">{t("dashboard.overview.description")}</Text>
              <HStack flexWrap="wrap" gap={3}>
                <Link to="/workspace/projects/new">
                  <Button colorPalette="brand">
                    <IconPlus /> {t("dashboard.overview.new_project")}
                  </Button>
                </Link>
                <Link to="/workspace/projects">
                  <Button variant="outline">{t("dashboard.overview.open_projects")}</Button>
                </Link>
              </HStack>
            </Stack>

            <SimpleGrid columns={2} gap={3} minW={{ xl: "xs" }}>
              <MiniStat label={t("dashboard.stats.projects")} value={formatValue(project_count)} />
              <MiniStat label={t("dashboard.stats.testers")} value={formatValue(tester_count)} />
              <MiniStat label={t("dashboard.stats.test_cases")} value={formatValue(test_case_count)} />
              <MiniStat label={t("dashboard.stats.test_plans")} value={formatValue(test_plan_count)} />
            </SimpleGrid>
          </Flex>
        </Card.Body>
      </Card.Root>

      {/* Performance Snapshot */}
      <Heading mb={4} display="flex" alignItems="center" gap={2} color="fg.heading">
        <IconDashboard /> {t("dashboard.performance.title")}
      </Heading>

      <Grid templateColumns="repeat(auto-fit, minmax(var(--chakra-sizes-56), 1fr))" gap={4} mb={6}>
        <MetricCard
          label={t("dashboard.stats.projects")}
          value={formatValue(project_count)}
          icon={IconTable}
          tone="brand"
          variant="emphasis"
          helperText={t("dashboard.performance.projects_helper")}
        />
        <MetricCard
          label={t("dashboard.stats.testers")}
          value={formatValue(tester_count)}
          icon={IconUser}
          tone="info"
          variant="subtle"
          helperText={t("dashboard.performance.testers_helper")}
        />
        <MetricCard
          label={t("dashboard.stats.test_cases")}
          value={formatValue(test_case_count)}
          icon={IconListCheck}
          tone="warning"
          variant="subtle"
          helperText={t("dashboard.performance.test_cases_helper")}
        />
        <MetricCard
          label={t("dashboard.stats.test_plans")}
          value={formatValue(test_plan_count)}
          icon={IconDashboard}
          tone="brand"
          helperText={t("dashboard.performance.test_plans_helper")}
        />
        <MetricCard
          label={t("dashboard.performance.closed_open_ratio")}
          value={ratioValue}
          tone={ratioTone}
          variant="emphasis"
          helperText={ratioHealth}
          trend={{ value: ratioHealth, direction: ratioDirection }}
        />
      </Grid>

      {/* Quick Actions */}
      <Grid templateColumns={{ base: "1fr", xl: "1fr 1fr" }} gap={6}>
        <GridItem>
          <Card.Root border="sm" borderColor="border.subtle" bg="bg.surface">
            <Card.Body p={5}>
              <Stack gap={4}>
                <Heading size="md" color="fg.heading">
                  {t("dashboard.quick_actions.title")}
                </Heading>
                <Stack gap={3}>
                  {quickActions.map((item) => (
                    <Flex
                      key={item.title}
                      justify="space-between"
                      align={{ base: "start", md: "center" }}
                      direction={{ base: "column", md: "row" }}
                      gap={3}
                      p={3}
                      border="sm"
                      borderColor="border.subtle"
                      borderRadius="lg"
                    >
                      <HStack align="start" gap={3}>
                        <Box w="9" h="9" borderRadius="md" bg="bg.subtle" display="grid" placeItems="center">
                          <Icon as={item.icon} />
                        </Box>
                        <Stack gap={0}>
                          <Text fontWeight="semibold" color="fg.heading">
                            {item.title}
                          </Text>
                          <Text fontSize="sm" color="fg.subtle">
                            {item.description}
                          </Text>
                        </Stack>
                      </HStack>
                      <Link to={item.to}>
                        <Button size="sm" variant="outline">
                          {item.action}
                        </Button>
                      </Link>
                    </Flex>
                  ))}
                </Stack>
              </Stack>
            </Card.Body>
          </Card.Root>
        </GridItem>

        {/* Recently Updated Projects */}
          <GridItem>
            <Card.Root border="sm" borderColor="border.subtle" bg="bg.surface">
              <Card.Body p={5}>
                <Stack gap={4}>
                  <HStack justify="space-between" align="center">
                    <Heading size="md" color="fg.heading">
                      {t("dashboard.recent.title")}
                    </Heading>
                    <Link to="/workspace/projects">
                      <Button size="xs" variant="ghost">
                        {t("dashboard.recent.view_all")}
                      </Button>
                    </Link>
                  </HStack>

                  {recentProjects.length > 0 ? (
                    <Stack gap={3}>
                      {recentProjects.slice(0, 6).map((project, index) => {
                        const projectId = project.id ? String(project.id) : "";
                        const title = project.name || t("dashboard.recent.untitled");
                        const updatedLabel = project.updated_at
                          ? new Date(project.updated_at).toLocaleString()
                          : t("dashboard.recent.unknown_update");

                        return (
                          <Box
                            key={project.id ?? `${title}-${index}`}
                            p={3}
                            border="sm"
                            borderColor="border.subtle"
                            borderRadius="lg"
                          >
                            <Flex justify="space-between" align="center" gap={3}>
                              <Stack gap={0}>
                                <Text fontWeight="semibold" color="fg.heading">
                                  {title}
                                </Text>
                                <Text fontSize="sm" color="fg.subtle">
                                  {t("dashboard.recent.updated")} {updatedLabel}
                                </Text>
                              </Stack>

                              {projectId ? (
                                <Link
                                  to="/projects/$projectId"
                                  params={{ projectId }}
                                >
                                  <Button size="xs" variant="outline">
                                    <IconTable /> {t("dashboard.recent.open")}
                                  </Button>
                                </Link>
                              ) : (
                                <Button size="xs" variant="outline" disabled>
                                  {t("dashboard.recent.open")}
                                </Button>
                              )}
                            </Flex>
                          </Box>
                        );
                      })}
                    </Stack>
                  ) : (
                    <Card.Root border="sm" borderColor="border.subtle" bg="bg.subtle">
                      <Card.Body p={4}>
                        <Text color="fg.subtle">
                          {t("dashboard.recent.empty")}
                        </Text>
                      </Card.Body>
                    </Card.Root>
                  )}
                              </Stack>
            </Card.Body>
          </Card.Root>
        </GridItem>
      </Grid>
    </Box>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <Box
      border="sm"
      borderColor="border.subtle"
      borderRadius="lg"
      bg="bg.surface"
      p={3}
    >
      <Text fontSize="xs" color="fg.subtle">
        {label}
      </Text>
      <Text fontSize="xl" fontWeight="bold" color="fg.heading">
        {value}
      </Text>
    </Box>
  );
}

export const Route = createFileRoute("/workspace/dashboard/")({
  component: DashboardPage,
});

