import { useCallback, useMemo, useRef, useState } from "react";
import { Badge, Box, Button, Flex, HStack, Icon, Spinner, Stack, Text } from "@chakra-ui/react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Link, useParams, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LuCheck, LuFolder, LuListTree, LuX } from "react-icons/lu";
import {
  findTestCaseSummaryQueryOptions,
  hasActiveInboxFilters,
  inboxListInfiniteQueryOptions,
  type InboxFilters,
} from "@/data/queries/test-cases";
import { PriorityBadge } from "@/components/PriorityBadge";
import { normalizePriority, PRIORITY_LEVELS } from "@/common/constants/priority";
import type { components } from "@/lib/api/v1";

type AssignedTestCase = components["schemas"]["schema.AssignedTestCase"];
type RunCounts = { usage: number; passed: number; failed: number };

interface InboxListProps {
  filters: InboxFilters;
  onClearFilters: () => void;
}

export function InboxList({ filters, onClearFilters }: InboxListProps) {
  const { t } = useTranslation();
  const [isGrouped, setIsGrouped] = useState(false);
  const { testCaseId: selectedId } = useParams({ strict: false }) as { testCaseId?: string };
  // A row is a test case in a test plan, so the open one is picked by both
  const { plan: selectedPlan } = useSearch({ strict: false }) as { plan?: number };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending, error } =
    useInfiniteQuery(inboxListInfiniteQueryOptions(filters));
  const { data: summary } = useQuery(findTestCaseSummaryQueryOptions);

  const testCases = useMemo(
    () => data?.pages.flatMap((page) => page?.test_cases ?? []) ?? [],
    [data],
  );
  const total = data?.pages[0]?.pagination?.total ?? testCases.length;

  const countsById = useMemo(() => {
    const map = new Map<string, RunCounts>();
    (summary ?? []).forEach((s) =>
      map.set(s.test_case_id ?? "", {
        usage: s.usage_count ?? 0,
        passed: s.success_count ?? 0,
        failed: s.failure_count ?? 0,
      }),
    );
    return map;
  }, [summary]);

  const groups = useMemo(() => {
    if (!isGrouped) return null;
    const byModule = new Map<string, AssignedTestCase[]>();
    testCases.forEach((tc) => {
      const name = tc.feature_or_module || t("inbox.no_module", "No module");
      byModule.set(name, [...(byModule.get(name) ?? []), tc]);
    });
    return Array.from(byModule.entries());
  }, [isGrouped, testCases, t]);

  // Load the next page when the bottom of the list scrolls into view
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      observerRef.current?.disconnect();
      if (!node) return;
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      });
      observerRef.current.observe(node);
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  if (isPending) {
    return (
      <Flex justify="center" py={10}>
        <Spinner color="brand.solid" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Box p={6} textAlign="center" color="fg.error" fontSize="sm">
        {t("inbox.error", "Could not load your inbox. Please refresh the page.")}
      </Box>
    );
  }

  if (testCases.length === 0) {
    return hasActiveInboxFilters(filters) ? (
      <Stack p={6} gap={3} align="center" textAlign="center">
        <Text fontWeight="semibold">{t("inbox.empty_filtered.title", "No test cases match your filters")}</Text>
        <Button size="sm" variant="outline" onClick={onClearFilters}>
          {t("inbox.filter.clear", "Clear filters")}
        </Button>
      </Stack>
    ) : (
      <Stack p={6} gap={2} align="center" textAlign="center">
        <Text fontWeight="semibold">{t("inbox.empty.title", "Your inbox is empty")}</Text>
        <Text fontSize="sm" color="fg.muted">
          {t(
            "inbox.empty.description",
            "Test cases appear here when someone adds them to a test plan and assigns them to you.",
          )}
        </Text>
      </Stack>
    );
  }

  const renderRow = (tc: AssignedTestCase) => (
    <InboxRow
      key={`${tc.test_plan_id ?? 0}:${tc.id ?? ""}`}
      tc={tc}
      counts={countsById.get(tc.id ?? "")}
      isSelected={tc.id === selectedId && (!selectedPlan || tc.test_plan_id === selectedPlan)}
    />
  );

  return (
    <Box>
      <Flex
        align="center"
        justify="space-between"
        px={3}
        py={1.5}
        borderBottom="sm"
        borderColor="border.subtle"
        bg="bg.subtle"
        position="sticky"
        top={0}
        zIndex={1}
      >
        <Text fontSize="xs" color="fg.muted">
          {t("inbox.showing", {
            shown: testCases.length,
            total,
            defaultValue: "Showing {{shown}} of {{total}}",
          })}
        </Text>
        <Button
          size="2xs"
          variant={isGrouped ? "subtle" : "ghost"}
          colorPalette={isGrouped ? "brand" : undefined}
          aria-pressed={isGrouped}
          onClick={() => setIsGrouped((g) => !g)}
        >
          <LuListTree />
          {t("inbox.group_by_module", "Group by module")}
        </Button>
      </Flex>

      {groups
        ? groups.map(([name, items]) => (
            <Box key={name}>
              <HStack
                px={3}
                py={1.5}
                gap={2}
                bg="bg.muted"
                borderBottom="sm"
                borderColor="border.subtle"
              >
                <Icon as={LuFolder} color="fg.subtle" boxSize="3.5" />
                <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase">
                  {name} ({items.length})
                </Text>
              </HStack>
              {items.map(renderRow)}
            </Box>
          ))
        : testCases.map(renderRow)}

      <Box ref={sentinelRef} h="1px" />
      {isFetchingNextPage && (
        <Flex justify="center" py={3}>
          <Spinner size="sm" color="brand.solid" />
        </Flex>
      )}
      {hasNextPage && !isFetchingNextPage && (
        <Flex justify="center" py={3}>
          <Button size="xs" variant="ghost" onClick={() => fetchNextPage()}>
            {t("inbox.load_more", "Load more")}
          </Button>
        </Flex>
      )}
    </Box>
  );
}

// Higher of the test case priority and the plan urgency. Only high and urgent are shown,
// so rows stay quiet unless something needs attention.
function attentionLevel(tc: AssignedTestCase) {
  const priority = normalizePriority(tc.priority);
  const urgency = normalizePriority(tc.urgency);
  const level =
    PRIORITY_LEVELS.indexOf(priority) >= PRIORITY_LEVELS.indexOf(urgency) ? priority : urgency;
  return level === "high" || level === "urgent" ? level : null;
}

function InboxRow({
  tc,
  counts,
  isSelected,
}: {
  tc: AssignedTestCase;
  counts?: RunCounts;
  isSelected: boolean;
}) {
  const { t } = useTranslation();
  const isNew = !tc.is_viewed;
  const attention = attentionLevel(tc);
  // The test plan tells rows of the same test case apart
  const details = [
    tc.code,
    tc.project_title,
    tc.test_plan_name,
    tc.feature_or_module,
    tc.environment_name,
  ].filter(Boolean);
  const isLocked = Boolean(tc.is_closed || tc.is_test_plan_closed);

  return (
    <Link
      to="/workspace/test-cases/inbox/$testCaseId"
      params={{ testCaseId: tc.id ?? "" }}
      search={{ plan: tc.test_plan_id || undefined }}
      title={tc.title}
    >
      <Box
        px={3}
        py={2.5}
        borderBottom="sm"
        borderColor="border.subtle"
        borderLeftWidth="3px"
        borderLeftColor={isSelected ? "brand.solid" : "transparent"}
        bg={isSelected ? "brand.subtle" : undefined}
        _hover={{ bg: isSelected ? "brand.subtle" : "bg.subtle" }}
        // Closed test cases and test cases of closed test plans can no longer be recorded
        opacity={isLocked ? 0.6 : 1}
        aria-current={isSelected ? "page" : undefined}
      >
        <Flex align="center" gap={2}>
          <Box
            w={2}
            h={2}
            rounded="full"
            flexShrink={0}
            bg={isNew ? "brand.solid" : "transparent"}
            aria-label={isNew ? t("inbox.new", "New") : undefined}
          />
          <Text
            flex="1"
            minW={0}
            truncate
            fontSize="sm"
            fontWeight={isNew ? "bold" : "medium"}
            color="fg.heading"
          >
            {tc.title}
          </Text>
          {tc.is_test_plan_closed ? (
            <Badge size="sm" variant="subtle">
              {t("inbox.test_plan_closed", "Test plan closed")}
            </Badge>
          ) : (
            tc.is_closed && (
              <Badge size="sm" variant="subtle">
                {t("inbox.closed", "Closed")}
              </Badge>
            )
          )}
          {attention && <PriorityBadge value={attention} />}
        </Flex>

        <Flex align="center" gap={2} mt={0.5} pl={4}>
          <Text flex="1" minW={0} truncate fontSize="xs" color="fg.subtle">
            {details.join(" · ")}
          </Text>
          <RunSummary counts={counts} />
        </Flex>
      </Box>
    </Link>
  );
}

function RunSummary({ counts }: { counts?: RunCounts }) {
  const { t } = useTranslation();
  if (!counts || counts.usage === 0) {
    return (
      <Text fontSize="xs" color="fg.subtle" flexShrink={0}>
        {t("inbox.not_run", "Not run yet")}
      </Text>
    );
  }
  return (
    <HStack
      gap={2}
      fontSize="xs"
      flexShrink={0}
      title={t("inbox.run_summary", {
        passed: counts.passed,
        failed: counts.failed,
        defaultValue: "{{passed}} passed, {{failed}} failed",
      })}
    >
      <HStack gap={0.5} color="fg.success">
        <LuCheck />
        <Text>{counts.passed}</Text>
      </HStack>
      <HStack gap={0.5} color={counts.failed > 0 ? "fg.error" : "fg.subtle"}>
        <LuX />
        <Text>{counts.failed}</Text>
      </HStack>
    </HStack>
  );
}
