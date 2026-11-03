import { useMemo, useState } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { IconSearch, IconX, IconPaperclip} from "@tabler/icons-react";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/page-states";
import { toaster } from "@/components/ui/toaster";
import type { components } from "@/lib/api/v1";
import { formatHumanDateTime } from "@/lib/date-time";
import {
  closeTestRun,
  getTestRunAttachments,
  getTestRunsByPlan,
} from "@/services/TestRunService";
import { getApiEndpoint } from "@/common/request";
import $api from "@/lib/api/query";
import { useTranslation } from "react-i18next";

type TestRunItem = components["schemas"]["schema.TestRunResponse"] & {
  latest_result_id?: string;
  attachment_count?: number;
};
type ResultFilter = "all" | "passed" | "failed" | "pending";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/test-plans/$testPlanID/test-runs/"
)({
  component: TestPlanTestRunsPage,
});

function TestPlanTestRunsPage() {
  const { t } = useTranslation();
  const { projectId, testPlanID } = Route.useParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [envFilter, setEnvFilter] = useState<number | "all">("all");
  const [closingRunId, setClosingRunId] = useState<string | null>(null);

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
      if (!matchesFilter || !matchesEnv) return false;
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
  }, [allRuns, resultFilter, envFilter, searchTerm]);

  const closedRuns = allRuns.filter((run) => run.is_closed).length;
  const openRuns = allRuns.length - closedRuns;
  const passedRuns = allRuns.filter(
    (run) => getResultState(run.result_state) === "passed"
  ).length;
  const failedRuns = allRuns.filter(
    (run) => getResultState(run.result_state) === "failed"
  ).length;

  if (isLoading) return <LoadingState label={t("test_plans.loading")} />;
  if (error) return <ErrorState title={t("test_plans.error")} />;

  const handleClose = async (runId: string) => {
    try {
      setClosingRunId(runId);
      await closeTestRun(runId);
      toaster.success({ title: t("test_plans.close_run.success") });
      await refetch();
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
            <HStack gap={2} flexWrap="wrap">
              <Badge colorPalette="brand" variant="subtle">
                {allRuns.length} {t("test_plans.runs.total")}
              </Badge>
              <Badge colorPalette="green" variant="subtle">
                {passedRuns} {t("test_plans.runs.passed")}
              </Badge>
              <Badge colorPalette="red" variant="subtle">
                {failedRuns} {t("test_plans.runs.failed")}
              </Badge>
              <Badge colorPalette="orange" variant="subtle">
                {openRuns} {t("test_plans.runs.open")}
              </Badge>
              <Badge colorPalette="gray" variant="subtle">
                {closedRuns} {t("test_plans.runs.closed")}
              </Badge>
            </HStack>
          </Stack>
        </Card.Body>
      </Card.Root>

      <Card.Root border="sm" borderColor="border.subtle" bg="bg.surface" mb={5}>
        <Card.Body p={4}>
          <Stack gap={3}>
            <InputGroup startElement={<IconSearch size={16} />}>
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t("test_plans.search_runs")}
              />
            </InputGroup>

            <HStack gap={2} flexWrap="wrap">
              {(["all", "passed", "failed", "pending"] as ResultFilter[]).map(
                (value) => (
                  <Button
                    key={value}
                    size="xs"
                    variant={resultFilter === value ? "solid" : "outline"}
                    colorPalette={resultFilter === value ? "brand" : "gray"}
                    onClick={() => setResultFilter(value)}
                  >
                    {t(`test_plans.filter.${value}`)}
                  </Button>
                )
              )}
            </HStack>

            <HStack gap={2} flexWrap="wrap">
              <Button
                size="xs"
                variant={envFilter === "all" ? "solid" : "outline"}
                colorPalette={envFilter === "all" ? "brand" : "gray"}
                onClick={() => setEnvFilter("all")}
              >
                {t("test_plans.all_envs")}
              </Button>
              {environments.map((env) => (
                <Button
                  key={env.id}
                  size="xs"
                  variant={envFilter === env.id ? "solid" : "outline"}
                  colorPalette={envFilter === env.id ? "brand" : "gray"}
                  onClick={() => setEnvFilter(env.id!)}
                >
                  {env.name}
                </Button>
              ))}
            </HStack>
          </Stack>
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
                          {run.is_closed ? t("test_plans.runs.closed") : t("test_plans.runs.open")}
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
                      />
                      <DetailItem
                        label={t("test_plans.detail.actual_result")}
                        value={run.actual_result}
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
                      <Text color="fg.default">
                        {run.notes?.trim() || t("test_plans.no_notes")}
                      </Text>
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
                    href={getAttachmentDownloadLink(attachment.storage_url)}
                    target="_blank"
                    rel="noreferrer"
                    fontWeight="medium"
                  >
                    {attachment.file_name}
                  </Link>
                  <Text fontSize="xs" color="fg.subtle">
                    {formatFileSize(attachment.file_size)}
                  </Text>
                </Flex>
              ))}
            </Stack>
          )}
        </Box>
      )}
    </Box>
  );
}

function formatFileSize(bytes?: number) {
  if (!bytes || bytes <= 0) return "0 bytes";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let index = 0;

  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }

  return `${size.toFixed(1)} ${units[index]}`;
}

function getAttachmentDownloadLink(storageUrl?: string) {
  if (!storageUrl) return "";
  if (storageUrl.startsWith("http://") || storageUrl.startsWith("https://")) {
    return storageUrl;
  }

  const apiEndpoint = getApiEndpoint().replace(/\/$/, "");
  return `${apiEndpoint}${storageUrl}`;
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

function DetailItem({ label, value }: { label: string; value?: string }) {
  const { t } = useTranslation();
  return (
    <Stack gap={1}>
      <Text fontSize="xs" color="fg.subtle">
        {label}
      </Text>
      <Text color="fg.default">{value?.trim() || t("test_plans.not_available")}</Text>
    </Stack>
  );
}
