import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Badge,
  Box,
  Button,
  Card,
  Circle,
  Flex,
  Heading,
  HStack,
  Icon,
  Progress,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { FiArrowRight, FiFileText, FiInbox, FiList, FiCheckCircle } from "react-icons/fi";
import type { IconType } from "react-icons";
import type { ReactNode } from "react";
import { useProjectQuery } from "@/services/ProjectService";
import { useProjectTestPlansQuery } from "@/services/TestPlanService";
import { useProjectSummaryQuery } from "@/services/ProjectSummaryService";
import {
  findTestCaseInboxQueryOptions,
  testCasesByProjectIdQueryOptions,
} from "@/data/queries/test-cases";
import { ErrorState, LoadingState } from "@/components/ui/page-states";

export const Route = createFileRoute("/(project)/projects/$projectId/overview/")({
  component: ProjectOverview,
});

const MAX_ACTIVE_PLANS = 5;

function ProjectOverview() {
  const { t } = useTranslation();
  const { projectId } = Route.useParams();
  const { data: project, isLoading, error } = useProjectQuery(projectId!);

  // Open inbox items across all projects (the inbox isn't filterable by project yet).
  const { data: inbox } = useQuery(findTestCaseInboxQueryOptions(false, 1, 1));
  const { data: testCases } = useQuery(
    testCasesByProjectIdQueryOptions(projectId, { page: 1, pageSize: 1 }),
  );
  const { data: testPlansData } = useProjectTestPlansQuery(projectId);
  const { data: summary } = useProjectSummaryQuery(projectId);

  if (isLoading) return <LoadingState label={t("projects.overview.loading")} />;
  if (error) return <ErrorState title={t("projects.overview.error")} />;

  const openInboxCount = inbox?.pagination?.total ?? inbox?.test_cases?.length ?? 0;
  const testCaseCount =
    testCases?.pagination?.total ?? testCases?.test_cases?.length ?? 0;
  const plans = testPlansData?.test_plans ?? [];
  // Same rule as the Test Plans page ("In Progress"), so the two pages always agree
  const activePlans = plans.filter((p) => !p.is_complete);
  const passed = summary?.passed ?? 0;
  const failed = summary?.failed ?? 0;

  return (
    <Stack gap={6} p={{ base: 4, md: 6 }} maxW="6xl">
      {/* Header */}
      <Stack gap={1}>
        <Heading size="xl" color="fg.heading">
          {project?.title ?? t("projects.overview.welcome_default")}
        </Heading>
        {project?.description && (
          <Text color="fg.subtle">{project.description}</Text>
        )}
      </Stack>

      {/* Primary call to action: what should I do right now? */}
      <Card.Root
        border="sm"
        borderColor={openInboxCount > 0 ? "brand.muted" : "border.subtle"}
        bg={openInboxCount > 0 ? "brand.subtle" : "bg.surface"}
      >
        <Card.Body p={{ base: 4, md: 6 }}>
          <Flex
            direction={{ base: "column", md: "row" }}
            align={{ base: "start", md: "center" }}
            justify="space-between"
            gap={4}
          >
            <HStack gap={4} align="start">
              <Circle size="12" bg="brand.solid" color="brand.contrast" flexShrink={0}>
                <Icon as={FiInbox} fontSize="xl" />
              </Circle>
              <Stack gap={1}>
                <Heading size="md" color="fg.heading">
                  {openInboxCount > 0
                    ? t("projects.overview.inbox_cta.title", { count: openInboxCount })
                    : t("projects.overview.inbox_cta.empty_title")}
                </Heading>
                <Text color="fg.muted">
                  {openInboxCount > 0
                    ? t("projects.overview.inbox_cta.description")
                    : t("projects.overview.inbox_cta.empty_description")}
                </Text>
              </Stack>
            </HStack>
            <Link to="/workspace/test-cases/inbox">
              <Button
                colorPalette="brand"
                variant={openInboxCount > 0 ? "solid" : "outline"}
                size="lg"
              >
                {t("projects.overview.inbox_cta.button")}
                <FiArrowRight />
              </Button>
            </Link>
          </Flex>
        </Card.Body>
      </Card.Root>

      {/* How testing works, with where this project currently stands */}
      <Stack gap={3}>
        <Heading size="md" color="fg.heading">
          {t("projects.overview.how_it_works")}
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
          <StepCard
            step={1}
            icon={FiFileText}
            title={t("projects.overview.step1.title")}
            description={t("projects.overview.step1.description")}
            status={t("projects.overview.step1.status", { count: testCaseCount })}
            action={
              <Link to="/projects/$projectId/test-cases" params={{ projectId }}>
                <Button size="sm" variant="outline" colorPalette="brand">
                  {t("projects.overview.step1.button")}
                </Button>
              </Link>
            }
          />
          <StepCard
            step={2}
            icon={FiList}
            title={t("projects.overview.step2.title")}
            description={t("projects.overview.step2.description")}
            status={t("projects.overview.step2.status", { count: activePlans.length })}
            action={
              <Link to="/projects/$projectId/test-plans" params={{ projectId }}>
                <Button size="sm" variant="outline" colorPalette="brand">
                  {t("projects.overview.step2.button")}
                </Button>
              </Link>
            }
          />
          <StepCard
            step={3}
            icon={FiCheckCircle}
            title={t("projects.overview.step3.title")}
            description={t("projects.overview.step3.description")}
            status={t("projects.overview.step3.status", { passed, failed })}
            action={
              <Link to="/workspace/test-cases/inbox">
                <Button size="sm" variant="outline" colorPalette="brand">
                  {t("projects.overview.step3.button")}
                </Button>
              </Link>
            }
          />
        </SimpleGrid>
      </Stack>

      {/* Active test plans with progress */}
      <Stack gap={3}>
        <Flex justify="space-between" align="center">
          <Heading size="md" color="fg.heading">
            {t("projects.overview.active_plans.title")}
          </Heading>
          {plans.length > 0 && (
            <Link to="/projects/$projectId/test-plans" params={{ projectId }}>
              <Button size="sm" variant="ghost" colorPalette="brand">
                {t("projects.overview.active_plans.view_all")}
                <FiArrowRight />
              </Button>
            </Link>
          )}
        </Flex>

        {activePlans.length === 0 ? (
          <Card.Root border="sm" borderColor="border.subtle" bg="bg.surface">
            <Card.Body p={5}>
              <Text color="fg.subtle">{t("projects.overview.active_plans.empty")}</Text>
            </Card.Body>
          </Card.Root>
        ) : (
          <Stack gap={2}>
            {activePlans.slice(0, MAX_ACTIVE_PLANS).map((plan) => {
              const planPassed = plan.passed_count ?? 0;
              const planFailed = plan.failed_count ?? 0;
              const total =
                plan.num_test_cases ?? planPassed + planFailed + (plan.pending_count ?? 0);
              const done = planPassed + planFailed;
              const percent = total > 0 ? Math.round((done / total) * 100) : 0;
              const title = plan.description?.trim() || `Test Plan #${plan.id}`;

              return (
                <Link
                  key={plan.id}
                  to="/projects/$projectId/test-plans/$testPlanID"
                  params={{ projectId, testPlanID: String(plan.id) }}
                >
                  <Card.Root
                    border="sm"
                    borderColor="border.subtle"
                    bg="bg.surface"
                    _hover={{ borderColor: "brand.muted", bg: "bg.subtle" }}
                    transition="all 0.15s"
                  >
                    <Card.Body p={4}>
                      <Flex
                        direction={{ base: "column", md: "row" }}
                        align={{ base: "stretch", md: "center" }}
                        gap={{ base: 2, md: 6 }}
                      >
                        <Text fontWeight="semibold" flex="1" lineClamp={1}>
                          {title}
                        </Text>
                        <HStack gap={3} minW={{ md: "72" }}>
                          <Progress.Root
                            value={percent}
                            size="sm"
                            colorPalette="brand"
                            flex="1"
                          >
                            <Progress.Track>
                              <Progress.Range />
                            </Progress.Track>
                          </Progress.Root>
                          <Text fontSize="sm" color="fg.subtle" whiteSpace="nowrap">
                            {t("projects.overview.active_plans.progress", { done, total })}
                          </Text>
                          {planFailed > 0 && (
                            <Badge colorPalette="danger" variant="subtle">
                              {t("projects.overview.active_plans.failed", { count: planFailed })}
                            </Badge>
                          )}
                        </HStack>
                      </Flex>
                    </Card.Body>
                  </Card.Root>
                </Link>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}

function StepCard({
  step,
  icon,
  title,
  description,
  status,
  action,
}: {
  step: number;
  icon: IconType;
  title: string;
  description: string;
  status: string;
  action: ReactNode;
}) {
  return (
    <Card.Root border="sm" borderColor="border.subtle" bg="bg.surface" h="full">
      <Card.Body p={5}>
        <Stack gap={3} h="full">
          <HStack gap={3}>
            <Circle size="8" bg="brand.subtle" color="brand.fg" fontWeight="bold" fontSize="sm">
              {step}
            </Circle>
            <Icon as={icon} color="fg.subtle" />
          </HStack>
          <Stack gap={1} flex="1">
            <Text fontWeight="semibold" color="fg.heading">
              {title}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              {description}
            </Text>
          </Stack>
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={3}>
              {status}
            </Text>
            {action}
          </Box>
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
