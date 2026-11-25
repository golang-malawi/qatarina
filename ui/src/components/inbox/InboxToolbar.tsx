import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Flex,
  Group,
  Heading,
  HStack,
  Input,
  InputGroup,
  NativeSelect,
  Text,
} from "@chakra-ui/react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LuLayoutGrid, LuList, LuPlus, LuSearch, LuX } from "react-icons/lu";
import { hasActiveInboxFilters, type InboxFilters } from "@/data/queries/test-cases";
import type { components } from "@/lib/api/v1";
import { FilterSelect } from "@/components/ui/filter-select";

export type InboxView = "list" | "grid";

type FilterOptions = components["schemas"]["schema.InboxFilterOptionsResponse"];

const SEARCH_DEBOUNCE_MS = 300;

interface InboxToolbarProps {
  filters: InboxFilters;
  onFiltersChange: (changes: Partial<InboxFilters>) => void;
  onClearFilters: () => void;
  options?: FilterOptions;
  view: InboxView;
  onViewChange: (view: InboxView) => void;
  totalCount?: number;
  unseenCount: number;
}

export function InboxToolbar({
  filters,
  onFiltersChange,
  onClearFilters,
  options,
  view,
  onViewChange,
  totalCount,
  unseenCount,
}: InboxToolbarProps) {
  const { t } = useTranslation();

  // Search is typed locally and sent to the server once typing pauses
  const [searchText, setSearchText] = useState(filters.search);
  useEffect(() => {
    setSearchText(filters.search);
  }, [filters.search]);
  useEffect(() => {
    const trimmed = searchText.trim();
    if (trimmed === filters.search) return;
    const timer = setTimeout(() => onFiltersChange({ search: trimmed }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchText, filters.search, onFiltersChange]);

  const projects = options?.projects ?? [];
  const environments = options?.environments ?? [];
  const testPlans = options?.test_plans ?? [];
  const modules = options?.modules ?? [];

  return (
    <Flex
      direction="column"
      gap={3}
      p={{ base: 3, md: 4 }}
      borderBottom="sm"
      borderColor="border.subtle"
      bg="bg.surface"
      flexShrink={0}
    >
      {/* Title, counts, view switch and main action */}
      <Flex align="center" justify="space-between" gap={3} wrap="wrap">
        <HStack gap={3} wrap="wrap">
          <Heading size="lg" color="fg.heading">
            {t("inbox.title", "Inbox")}
          </Heading>
          {totalCount !== undefined && (
            <Text color="fg.muted" fontSize="sm">
              {t("inbox.count", { count: totalCount, defaultValue: "{{count}} test cases" })}
            </Text>
          )}
          {unseenCount > 0 && (
            <Badge colorPalette="danger" variant="solid" rounded="full">
              {t("inbox.unseen", { count: unseenCount, defaultValue: "{{count}} new" })}
            </Badge>
          )}
        </HStack>

        <HStack gap={2}>
          <Group attached role="group" aria-label={t("inbox.view.label", "Choose how to show test cases")}>
            <Button
              size="sm"
              colorPalette="brand"
              variant={view === "list" ? "solid" : "outline"}
              aria-pressed={view === "list"}
              onClick={() => onViewChange("list")}
              title={t("inbox.view.list_hint", "Open test cases one at a time")}
            >
              <LuList />
              {t("inbox.view.list", "List")}
            </Button>
            <Button
              size="sm"
              colorPalette="brand"
              variant={view === "grid" ? "solid" : "outline"}
              aria-pressed={view === "grid"}
              onClick={() => onViewChange("grid")}
              title={t("inbox.view.grid_hint", "See all test cases in a table and record results in bulk")}
            >
              <LuLayoutGrid />
              {t("inbox.view.grid", "Grid")}
            </Button>
          </Group>
          <Link to="/workspace/test-cases/inbox/suggest">
            <Button size="sm" variant="ghost" colorPalette="brand">
              <LuPlus />
              {t("inbox.suggest", "Suggest test case")}
            </Button>
          </Link>
        </HStack>
      </Flex>

      {/* Search and filters, applied to the whole inbox by the server */}
      <Flex gap={2} wrap="wrap" align="center">
        <InputGroup startElement={<LuSearch />} flex="1" minW={{ base: "full", md: "64" }}>
          <Input
            size="sm"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder={t("inbox.search_placeholder", "Search by title, code or module...")}
            aria-label={t("inbox.search_label", "Search test cases")}
          />
        </InputGroup>

        {projects.length > 1 && (
          <FilterSelect
            label={t("inbox.filter.project", "Project")}
            allLabel={t("inbox.filter.all_projects", "All projects")}
            value={filters.projectId}
            options={projects}
            // The other dropdowns only list what is in the chosen project, so clear choices from another project
            onChange={(projectId) =>
              onFiltersChange({ projectId, environmentId: "", testPlanId: "", module: "" })
            }
          />
        )}
        {environments.length > 0 && (
          <FilterSelect
            label={t("inbox.filter.environment", "Environment")}
            allLabel={t("inbox.filter.all_environments", "All environments")}
            value={filters.environmentId}
            options={environments}
            onChange={(environmentId) => onFiltersChange({ environmentId })}
          />
        )}
        {testPlans.length > 0 && (
          <FilterSelect
            label={t("inbox.filter.test_plan", "Test plan")}
            allLabel={t("inbox.filter.all_test_plans", "All test plans")}
            value={filters.testPlanId}
            options={testPlans}
            onChange={(testPlanId) => onFiltersChange({ testPlanId })}
          />
        )}
        {modules.length > 0 && (
          <FilterSelect
            label={t("inbox.filter.module", "Module")}
            allLabel={t("inbox.filter.all_modules", "All modules")}
            value={filters.module}
            options={modules}
            onChange={(module) => onFiltersChange({ module })}
          />
        )}
        <NativeSelect.Root size="sm" w="auto" minW="36">
          <NativeSelect.Field
            aria-label={t("inbox.filter.status", "Status")}
            value={filters.includeClosed ? "all" : "open"}
            onChange={(e) => onFiltersChange({ includeClosed: e.target.value === "all" })}
          >
            <option value="open">{t("inbox.filter.open_only", "Open only")}</option>
            {/* History adds closed test cases and test cases of closed test plans */}
            <option value="all">{t("inbox.filter.open_and_closed", "Open and closed")}</option>
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>

        {hasActiveInboxFilters(filters) && (
          <Button size="sm" variant="ghost" onClick={onClearFilters}>
            <LuX />
            {t("inbox.filter.clear", "Clear filters")}
          </Button>
        )}
      </Flex>
    </Flex>
  );
}
