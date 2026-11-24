import { useMemo, useState, type ReactNode } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  HStack,
  Input,
  InputGroup,
  Link,
  Separator,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { IconSearch, IconX, IconPaperclip, IconDownload } from "@tabler/icons-react";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/page-states";
import { toaster } from "@/components/ui/toaster";
import { FilterSelect } from "@/components/ui/filter-select";
import { MarkdownChecklist } from "@/components/MarkdownChecklist";
import type { components } from "@/lib/api/v1";
import { formatHumanDateTime } from "@/lib/date-time";
import {
  closeTestRun,
  getTestRunAttachments,
  getTestRunsByPlan,
} from "@/services/TestRunService";
import { formatFileSize, getStoredFileUrl } from "@/lib/files";
import $api from "@/lib/api/query";
import { useTranslation } from "react-i18next";

type TestRunItem = components["schemas"]["schema.TestRunResponse"] & {
  latest_result_id?: string;
  attachment_count?: number;
};
type ResultFilter = "all" | "passed" | "failed" | "pending";
// Awaiting review: a result was recorded but the plan owner has not closed the run yet
type ReviewFilter = "all" | "awaiting" | "reviewed";
const RESULT_FILTERS = ["passed", "failed", "pending"] as const;

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-plans/$testPlanID/test-runs/"
)({
  // ?review=awaiting lets other pages link straight to the runs waiting for review
  validateSearch: (search: Record<string, unknown>): { review?: ReviewFilter } => {
    const review = search.review;
    return review === "awaiting" || review === "reviewed" ? { review } : {};
  },
  component: TestPlanTestRunsPage,
});

function isAwaitingReview(run: TestRunItem) {
  return !run.is_closed && getResultState(run.result_state) !== "pending";
}

function TestPlanTestRunsPage() {
  const { t } = useTranslation();
  const { projectId, testPlanID } = Route.useParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [envFilter, setEnvFilter] = useState<number | "all">("all");
  const { review: reviewFilter = "all" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const setReviewFilter = (value: ReviewFilter) =>
    navigate({
      search: (prev) => ({ ...prev, review: value === "all" ? undefined : value }),
      replace: true,
    });
  const [closingRunId, setClosingRunId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["testRuns", testPlanID],
    queryFn: () => getTestRunsByPlan(testPlanID),
  });

  // Fetch environments for this project
  const { data: envData } = $api.useQuery(
    "get",
    "/v1/projects/{projectID}/environments",
    { params: { path: { projectID: projectId } } }
  );
  const environments = envData?.environments ?? [];

  const allRuns = useMemo(() => {
    const runs = data?.test_runs;
    return Array.isArray(runs) ? (runs as TestRunItem[]) : [];
  }, [data?.test_runs]);

  const filteredRuns = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return allRuns.filter((run) => {
      const runState = getResultState(run.result_state);
      const matchesFilter = resultFilter === "all" || runState === resultFilter;
      const matchesEnv =
        envFilter === "all" || run.environment_id === envFilter;
      const matchesReview =
        reviewFilter === "all" ||
        (reviewFilter === "awaiting" ? isAwaitingReview(run) : !!run.is_closed);
      if (!matchesFilter || !matchesEnv || !matchesReview) return false;
      if (!term) return true;
      const searchable = [
        run.id,
        run.code,
        run.test_case_title,
        run.executed_by,
        run.result_state,
        run.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchable.includes(term);
    });
  }, [allRuns, resultFilter, envFilter, reviewFilter, searchTerm]);

  const closedRuns = allRuns.filter((run) => run.is_closed).length;
  const awaitingReviewRuns = allRuns.filter(isAwaitingReview).length;
  const resultCounts = { passed: 0, failed: 0, pending: 0 };
  allRuns.forEach((run) => {
    resultCounts[getResultState(run.result_state) as Exclude<ResultFilter, "all">] += 1;
  });

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    resultFilter !== "all" ||
    reviewFilter !== "all" ||
    envFilter !== "all";
  const clearFilters = () => {
    setSearchTerm("");
    setResultFilter("all");
    setEnvFilter("all");
    setReviewFilter("all");
  };

  if (isLoading) return <LoadingState label={t("test_plans.loading")} />;
  if (error) return <ErrorState title={t("test_plans.error")} />;

  const handleClose = async (runId: string) => {
    try {
      setClosingRunId(runId);
      await closeTestRun(runId);
      toaster.success({ title: t("test_plans.close_run.success") });
      await refetch();
      // A closed run moves its test case from awaiting review to reviewed
      queryClient.invalidateQueries({
        queryKey: ["get", "/v1/test-plans/{testPlanID}/tester-progress"],
      });
    } catch (closeError) {
      console.error("Failed to close test run", closeError);
      toaster.error({ title: t("test_plans.close_run.error") });
    } finally {
      setClosingRunId(null);
    }
  };

  return (
    <Box w="full">
      <Card.Root border="sm" borderColor="border.subtle" bg="bg.surface" mb={5}>
        <Card.Body p={{ base: 4, md: 6 }}>
          <Stack gap={2}>
            <Heading size="lg" color="fg.heading">
              {t("test_plans.runs")}
            </Heading>
            <Text color="fg.subtle">{t("test_plans.runs_description")}</Text>
            {/* Each count is also a shortcut that filters the list to it */}
            <HStack gap={2} flexWrap="wrap">
              <SummaryBadge colorPalette="brand" onClick={clearFilters}>
                {allRuns.length} {t("test_plans.runs.total")}
              </SummaryBadge>
              <SummaryBadge
                colorPalette="green"
                active={resultFilter === "passed"}
                onClick={() => setResultFilter("passed")}
              >
                {resultCounts.passed} {t("test_plans.runs.passed")}
              </SummaryBadge>
              <SummaryBadge
                colorPalette="red"
                active={resultFilter === "failed"}
                onClick={() => setResultFilter("failed")}
              >
                {resultCounts.failed} {t("test_plans.runs.failed")}
              </SummaryBadge>
              <SummaryBadge
                colorPalette="orange"
                active={reviewFilter === "awaiting"}
                onClick={() => setReviewFilter("awaiting")}
              >
                {awaitingReviewRuns} {t("test_plans.runs.awaiting_review")}
              </SummaryBadge>
              <SummaryBadge
                colorPalette="gray"
                active={reviewFilter === "reviewed"}
                onClick={() => setReviewFilter("reviewed")}
              >
                {closedRuns} {t("test_plans.runs.reviewed")}
              </SummaryBadge>
            </HStack>
          </Stack>
        </Card.Body>
      </Card.Root>

      <Card.Root border="sm" borderColor="border.subtle" bg="bg.surface" mb={5}>
        <Card.Body p={4}>
          <Flex gap={2} wrap="wrap" align="center">
            <InputGroup
              startElement={<IconSearch size={16} />}
              flex="1"
              minW={{ base: "full", md: "64" }}
            >
              <Input
                size="sm"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t("test_plans.search_runs")}
              />
            </InputGroup>
            <FilterSelect
              label={t("test_plans.filter.result")}
              allLabel={t("test_plans.filter.all_results")}
              value={resultFilter === "all" ? "" : resultFilter}
              options={RESULT_FILTERS.map((value) => ({
                value,
                label: `${t(`test_plans.filter.${value}`)} (${resultCounts[value]})`,
              }))}
              onChange={(value) => setResultFilter((value || "all") as ResultFilter)}
            />
            <FilterSelect
              label={t("test_plans.review_filter.label")}
              allLabel={t("test_plans.review_filter.all")}
              value={reviewFilter === "all" ? "" : reviewFilter}
              options={[
                {
                  value: "awaiting",
                  label: `${t("test_plans.review_filter.awaiting")} (${awaitingReviewRuns})`,
                },
                {
                  value: "reviewed",
                  label: `${t("test_plans.review_filter.reviewed")} (${closedRuns})`,
                },
              ]}
              onChange={(value) => setReviewFilter((value || "all") as ReviewFilter)}
            />
            {environments.length > 0 && (
              <FilterSelect
                label={t("test_plans.filter.environment")}
                allLabel={t("test_plans.all_envs")}
                value={envFilter === "all" ? "" : String(envFilter)}
                options={environments.map((env) => ({
                  value: String(env.id),
                  label: env.name,
                }))}
                onChange={(value) => setEnvFilter(value ? Number(value) : "all")}
              />
            )}
            {hasActiveFilters && (
              <Button size="sm" variant="ghost" onClick={clearFilters}>
                <IconX size={16} />
                {t("test_plans.filter.clear")}
              </Button>
            )}
          </Flex>
        </Card.Body>
      </Card.Root>

      {allRuns.length === 0 ? (
        <EmptyState
          title={t("test_plans.empty_runs")}
          description={t("test_plans.empty_runs_description")}
        />
      ) : filteredRuns.length === 0 ? (
        <EmptyState
          title={t("test_plans.no_match_runs")}
          description={t("test_plans.no_match_runs_description")}
        />
      ) : (
        <Stack gap={4}>
          {filteredRuns.map((run, index) => {
            const runStatus = getResultState(run.result_state);
            const runLabel =
              run.test_case_title?.trim() || `Test Run ${index + 1}`;
            const runId = run.id ?? "";

            return (
              <Card.Root
                key={run.id ?? `${runLabel}-${index}`}
                border="sm"
                borderColor="border.subtle"
                bg="bg.surface"
                shadow="sm"
              >
                <Card.Body p={5}>
                  <Stack gap={4}>
                    <Flex
                      direction={{ base: "column", md: "row" }}
                      justify="space-between"
                      align={{ base: "start", md: "center" }}
                      gap={3}
                    >
                      <Stack gap={1}>
                        <Heading size="md" color="fg.heading">
                          {runLabel}
                        </Heading>
                        {run.code && (
                          <Text fontSize="sm" color="fg.subtle">
                            Code: {run.code}
                          </Text>
                        )}
                      </Stack>

                                            <HStack gap={2} flexWrap="wrap">
                        <Badge
                          colorPalette={getResultColor(runStatus)}
                          variant="subtle"
                        >
                          {runStatus.toUpperCase()}
                        </Badge>
                        <Badge
                          colorPalette={run.is_closed ? "gray" : "orange"}
                          variant="subtle"
                        >
                          {run.is_closed
                            ? t("test_plans.runs.reviewed")
                            : isAwaitingReview(run)
                              ? t("test_plans.runs.awaiting_review")
                              : t("test_plans.runs.open")}
                        </Badge>
                        {run.attachment_count ? (
                          <Badge colorPalette="blue" variant="subtle">
                            <Flex align="center" gap={1}>
                              <IconPaperclip size={14} />
                              {run.attachment_count} attachment
                              {run.attachment_count > 1 ? "s" : ""}
                            </Flex>
                          </Badge>
                        ) : null}
                        {runId && (
                          <Badge colorPalette="blue" variant="outline">
                            ID: {runId}
                          </Badge>
                        )}
                      </HStack>
                    </Flex>

                    <Grid
                      templateColumns={{
                        base: "1fr",
                        md: "repeat(2, minmax(0, 1fr))",
                      }}
                      gap={4}
                    >
                      <DetailItem label={t("test_plans.detail.executed_by")} value={run.executed_by} />
                      <DetailItem
                        label={t("test_plans.detail.tested_on")}
                        value={formatHumanDateTime(run.tested_on, {
                          fallback: t("test_plans.not_recorded"),
                        })}
                      />
                      <DetailItem
                        label={t("test_plans.detail.expected_result")}
                        value={run.expected_result}
                        markdown
                      />
                      <DetailItem
                        label={t("test_plans.detail.actual_result")}
                        value={run.actual_result}
                        markdown
                      />
                      <DetailItem
                        label={t("test_plans.detail.environment")}
                        value={
                          environments.find((e) => e.id === run.environment_id)?.name ||
                          t("test_plans.not_available")
                        }
                      />
                    </Grid>

                    <Separator />

                    <Stack gap={2}>
                      <Text fontSize="xs" color="fg.subtle">
                        {t("test_plans.detail.notes")}
                      </Text>
                      {run.notes?.trim() ? (
                        <MarkdownChecklist markdown={run.notes.trim()} />
                      ) : (
                        <Text color="fg.default">{t("test_plans.no_notes")}</Text>
                      )}
                    </Stack>

                    <AttachmentSection
                      latestResultId={run.latest_result_id}
                      attachmentCount={run.attachment_count}
                    />

                    {!run.is_closed && runId && (
                      <Button
                        alignSelf="start"
                        size="sm"
                        variant="outline"
                        colorPalette="red"
                        loading={closingRunId === runId}
                        onClick={() => handleClose(runId)}
                      >
                        <IconX />
                        {t("test_plans.close_run")}
                      </Button>
                    )}
                  </Stack>
                </Card.Body>
              </Card.Root>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}

function AttachmentSection({
  latestResultId,
  attachmentCount,
}: {
  latestResultId?: string;
  attachmentCount?: number;
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const {
    data: attachments = [],
    isLoading,
  } = useQuery({
    queryKey: ["testRunAttachments", latestResultId],
    queryFn: () =>
      latestResultId ? getTestRunAttachments(latestResultId) : Promise.resolve([]),
    enabled: isOpen && Boolean(latestResultId),
  });

  if (!latestResultId) {
    return null;
  }

  return (
    <Box>
      <Flex align="center" gap={3}>
        <Badge colorPalette="blue" variant="subtle">
          <Flex align="center" gap={1}>
            <IconPaperclip size={14} />
            {attachmentCount ?? 0} attachment{(attachmentCount ?? 0) === 1 ? "" : "s"}
          </Flex>
        </Badge>
        <Button
          size="xs"
          variant="outline"
          colorPalette="brand"
          onClick={() => setIsOpen((prev) => !prev)}
          disabled={attachmentCount === 0}
        >
          {isOpen ? "Hide attachments" : "View attachments"}
        </Button>
      </Flex>
      {isOpen && (
        <Box mt={3} pl={2}>
          {isLoading ? (
            <Text fontSize="sm" color="fg.subtle">
              Loading attachments...
            </Text>
          ) : attachments.length === 0 ? (
            <Text fontSize="sm" color="fg.subtle">
              No attachments available.
            </Text>
          ) : (
            <Stack gap={2}>
              {attachments.map((attachment) => (
                <Flex key={attachment.id} align="center" gap={2}>
                  <IconPaperclip size={16} />
                  <Link
                    href={getStoredFileUrl(attachment.storage_url)}
                    target="_blank"
                    rel="noreferrer"
                    fontWeight="medium"
                  >
                    {attachment.file_name}
                  </Link>
                  <Text fontSize="xs" color="fg.subtle">
                    {formatFileSize(attachment.file_size)}
                  </Text>
                  <Button asChild size="xs" variant="ghost" colorPalette="brand">
                    <a
                      href={getStoredFileUrl(attachment.storage_url, attachment.file_name)}
                      download={attachment.file_name}
                    >
                      <IconDownload size={14} />
                      {t("test_plans.runs.download_attachment")}
                    </a>
                  </Button>
                </Flex>
              ))}
            </Stack>
          )}
        </Box>
      )}
    </Box>
  );
}

function SummaryBadge({
  colorPalette,
  active = false,
  onClick,
  children,
}: {
  colorPalette: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Badge asChild colorPalette={colorPalette} variant={active ? "solid" : "subtle"}>
      <button type="button" onClick={onClick} style={{ cursor: "pointer" }}>
        {children}
      </button>
    </Badge>
  );
}

function getResultState(resultState?: string): ResultFilter {
  const normalized = (resultState ?? "").toLowerCase();
  if (normalized.includes("pass")) return "passed";
  if (normalized.includes("fail")) return "failed";
  if (normalized.includes("pending")) return "pending";
  return "pending";
}

function getResultColor(state: ResultFilter) {
  switch (state) {
    case "passed":
      return "green";
    case "failed":
      return "red";
    default:
      return "orange";
  }
}

function DetailItem({
  label,
  value,
  markdown = false,
}: {
  label: string;
  value?: string;
  /** Render the value as GitHub-flavoured markdown (read-only checklists) */
  markdown?: boolean;
}) {
  const { t } = useTranslation();
  const content = value?.trim();
  return (
    <Stack gap={1} minW={0}>
      <Text fontSize="xs" color="fg.subtle">
        {label}
      </Text>
      {markdown && content ? (
        <MarkdownChecklist markdown={content} />
      ) : (
        <Text color="fg.default">{content || t("test_plans.not_available")}</Text>
      )}
    </Stack>
  );
}
