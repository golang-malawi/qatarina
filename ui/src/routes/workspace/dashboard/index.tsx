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

const quickActions: QuickAction[] = [
  {
    title: "Create a project",
    description: "Start a new QA workspace and define scope.",
    to: "/workspace/projects/new",
    action: "New project",
    icon: IconPlus,
  },
  {
    title: "Invite testers",
    description: "Expand your testing pool and assign access.",
    to: "/workspace/testers/invite",
    action: "Invite users",
    icon: IconUser,
  },
  {
    title: "Review inbox",
    description: "Triage test case signals and activity updates.",
    to: "/workspace/test-cases/inbox",
    action: "Open inbox",
    icon: IconListCheck,
  },
  {
    title: "Manage projects",
    description: "Open existing projects and update planning.",
    to: "/workspace/projects",
    action: "View projects",
    icon: IconSettings,
  },
];

const formatValue = (value?: number) => {
  if (typeof value !== "number") return "N/A";
  return value.toLocaleString();
};

const formatRatio = (value?: number) => {
  if (typeof value !== "number") return "N/A";
  return value.toFixed(2);
};

function DashboardPage() {
  const {
    data,
    isPending,
    error,
  } = useSuspenseQuery($api.queryOptions("get", "/v1/dashboard/summary" as any, {}));

  if (isPending) return <Spinner size="xl" color="brand.solid" />;
  if (error) return <Text color="fg.error">Failed to load dashboard data.</Text>;

  const {
    project_count,
    tester_count,
    test_case_count,
    test_plan_count,
    closed_to_open_ratio,
    recent_projects,
  } = data;
  const recentProjects = Array.isArray(recent_projects) ? recent_projects : [];
  const ratioValue = formatRatio(closed_to_open_ratio);
  const ratioHealth =
    typeof closed_to_open_ratio === "number"
      ? closed_to_open_ratio >= 1
        ? "Healthy throughput"
        : "Needs attention"
      : "No data yet";
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

  return (
    <Box w="full">
      <Card.Root
        border="sm"
        borderColor="border.subtle"
        bgGradient="linear(to-r, bg.surface, bg.subtle)"
        shadow="sm"
        mb={6}
      >
        <Card.Body p={{ base: 5, md: 7 }}>
          <Flex
            direction={{ base: "column", xl: "row" }}
            justify="space-between"
            gap={6}
          >
            <Stack gap={3} maxW="2xl">
              <Badge alignSelf="start" colorPalette="brand" variant="subtle">
                Workspace Overview
              </Badge>
              <Heading size="2xl" color="fg.heading">
                QA Command Center
              </Heading>
              <Text color="fg.muted">
                Track project momentum, monitor testing throughput, and launch
                the next action without leaving the workspace.
              </Text>
              <HStack flexWrap="wrap" gap={3}>
                <Link to="/workspace/projects/new">
                  <Button colorPalette="brand">
                    <IconPlus />
                    New Project
                  </Button>
                </Link>
                <Link to="/workspace/projects">
                  <Button variant="outline">Open Projects</Button>
                </Link>
              </HStack>
            </Stack>

            <SimpleGrid columns={2} gap={3} minW={{ xl: "xs" }}>
              <MiniStat label="Projects" value={formatValue(project_count)} />
              <MiniStat label="Testers" value={formatValue(tester_count)} />
              <MiniStat label="Test Cases" value={formatValue(test_case_count)} />
              <MiniStat label="Test Plans" value={formatValue(test_plan_count)} />
            </SimpleGrid>
          </Flex>
        </Card.Body>
      </Card.Root>

      <Heading
        mb={4}
        display="flex"
        alignItems="center"
        gap={2}
        color="fg.heading"
      >
        <IconDashboard />
        Performance Snapshot
      </Heading>

      <Grid
        templateColumns="repeat(auto-fit, minmax(var(--chakra-sizes-56), 1fr))"
        gap={4}
        mb={6}
      >
        <MetricCard
          label="Projects"
          value={formatValue(project_count)}
          icon={IconTable}
          tone="brand"
          variant="emphasis"
          helperText="Tracked workspaces"
        />
        <MetricCard
          label="Testers"
          value={formatValue(tester_count)}
          icon={IconUser}
          tone="info"
          variant="subtle"
          helperText="Active collaborators"
        />
        <MetricCard
          label="Test Cases"
          value={formatValue(test_case_count)}
          icon={IconListCheck}
          tone="warning"
          variant="subtle"
          helperText="Coverage inventory"
        />
        <MetricCard
          label="Test Plans"
          value={formatValue(test_plan_count)}
          icon={IconDashboard}
          tone="brand"
          helperText="Execution roadmaps"
        />
        <MetricCard
          label="Closed/Open Ratio"
          value={ratioValue}
          tone={ratioTone}
          variant="emphasis"
          helperText={ratioHealth}
          trend={{ value: ratioHealth, direction: ratioDirection }}
        />
      </Grid>

      <Grid templateColumns={{ base: "1fr", xl: "1fr 1fr" }} gap={6}>
        <GridItem>
          <Card.Root border="sm" borderColor="border.subtle" bg="bg.surface">
            <Card.Body p={5}>
              <Stack gap={4}>
                <Heading size="md" color="fg.heading">
                  Quick Actions
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
                        <Box
                          w="9"
                          h="9"
                          borderRadius="md"
                          bg="bg.subtle"
                          display="grid"
                          placeItems="center"
                        >
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

        <GridItem>
          <Card.Root border="sm" borderColor="border.subtle" bg="bg.surface">
            <Card.Body p={5}>
              <Stack gap={4}>
                <HStack justify="space-between" align="center">
                  <Heading size="md" color="fg.heading">
                    Recently Updated Projects
                  </Heading>
                  <Link to="/workspace/projects">
                    <Button size="xs" variant="ghost">
                      View all
                    </Button>
                  </Link>
                </HStack>

                {recentProjects.length > 0 ? (
                  <Stack gap={3}>
                    {recentProjects.slice(0, 6).map((project, index) => {
                      const projectId = project.id ? String(project.id) : "";
                      const title = project.name || "Untitled Project";
                      const updatedLabel = project.updated_at
                        ? new Date(project.updated_at).toLocaleString()
                        : "Unknown update time";

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
                                Updated: {updatedLabel}
                              </Text>
                            </Stack>
                            {projectId ? (
                              <Link
                                to="/projects/$projectId"
                                params={{ projectId }}
                              >
                                <Button size="xs" variant="outline">
                                  <IconTable />
                                  Open
                                </Button>
                              </Link>
                            ) : (
                              <Button size="xs" variant="outline" disabled>
                                Open
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
                        No recent projects found yet. Create or update a project
                        to populate this feed.
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
