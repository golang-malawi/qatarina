import {
  emptyInboxFilters,
  findInboxFilterOptionsQueryOptions,
  findInboxUnseenCountQueryOptions,
  findTestCaseSummaryQueryOptions,
  inboxListInfiniteQueryOptions,
  type InboxFilters,
} from "@/data/queries/test-cases";
import { Box, Flex } from "@chakra-ui/react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SheetView } from "./sheetView";
import { InboxToolbar, type InboxView } from "@/components/inbox/InboxToolbar";
import { InboxList } from "@/components/inbox/InboxList";

export const Route = createFileRoute("/workspace/test-cases/inbox")({
  loader: ({ context: { queryClient } }) => {
    queryClient.prefetchInfiniteQuery(inboxListInfiniteQueryOptions(emptyInboxFilters));
    queryClient.prefetchQuery(findInboxFilterOptionsQueryOptions(false));
    queryClient.prefetchQuery(findTestCaseSummaryQueryOptions);
  },
  component: TestCasePageInbox,
});

// Remember List/Grid per browser so people come back to the view they chose
const VIEW_STORAGE_KEY = "qatarina.inbox-view";

function readStoredView(): InboxView {
  try {
    return localStorage.getItem(VIEW_STORAGE_KEY) === "grid" ? "grid" : "list";
  } catch {
    return "list";
  }
}

function TestCasePageInbox() {
  // The content pane scrolls on its own, so the router's scroll reset doesn't reach it.
  // Jump back to the top whenever a different test case opens (list click, Next/Previous, after recording).
  const contentPaneRef = useRef<HTMLDivElement | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    contentPaneRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  const [filters, setFilters] = useState<InboxFilters>(emptyInboxFilters);
  const updateFilters = useCallback(
    (changes: Partial<InboxFilters>) => setFilters((prev) => ({ ...prev, ...changes })),
    [],
  );
  const clearFilters = useCallback(() => setFilters(emptyInboxFilters), []);

  const [view, setView] = useState<InboxView>(readStoredView);
  const changeView = (next: InboxView) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      // Ignore storage errors (e.g. private mode)
    }
  };

  const { data: unseenCount = 0 } = useQuery(findInboxUnseenCountQueryOptions);
  const { data: filterOptions } = useQuery(
    findInboxFilterOptionsQueryOptions(filters.includeClosed),
  );
  // Same query (and cache entry) as the list and grid; read here for the total in the toolbar
  const { data: listData } = useInfiniteQuery(inboxListInfiniteQueryOptions(filters));
  const totalCount = listData?.pages[0]?.pagination?.total;

  // Names for the grid view, from the projects and environments present in the inbox
  const projectMap = useMemo(() => {
    const map: Record<number, string> = {};
    filterOptions?.projects?.forEach((p) => {
      map[Number(p.value)] = p.label ?? "";
    });
    return map;
  }, [filterOptions]);
  const environmentMap = useMemo(() => {
    const map: Record<number, string> = {};
    filterOptions?.environments?.forEach((e) => {
      map[Number(e.value)] = e.label ?? "";
    });
    return map;
  }, [filterOptions]);

  // The suggest form opens in the right-hand pane, which only the list layout has
  const isGrid = view === "grid" && !pathname.endsWith("/inbox/suggest");

  return (
    <Flex
      direction="column"
      // Fill the space under the app bar so the list and the test case scroll separately
      h={{ base: "auto", md: "calc(100dvh - 10rem)" }}
      minH="lg"
      border="sm"
      borderColor="border.subtle"
      borderRadius="lg"
      overflow="hidden"
      bg="bg.surface"
    >
      <InboxToolbar
        filters={filters}
        onFiltersChange={updateFilters}
        onClearFilters={clearFilters}
        options={filterOptions}
        view={view}
        onViewChange={changeView}
        totalCount={totalCount}
        unseenCount={unseenCount}
      />

      {isGrid ? (
        <Box flex="1" minH={0} overflow="hidden" bg="bg.canvas">
          <SheetView projectMap={projectMap} environmentMap={environmentMap} filters={filters} />
        </Box>
      ) : (
        <Flex flex="1" minH={0} direction={{ base: "column", md: "row" }}>
          <Box
            w={{ base: "full", md: "sm", lg: "md" }}
            flexShrink={0}
            borderRight={{ md: "sm" }}
            borderBottom={{ base: "sm", md: "none" }}
            borderColor="border.subtle"
            bg="bg.surface"
            overflowY="auto"
            maxH={{ base: "50vh", md: "none" }}
          >
            <InboxList filters={filters} onClearFilters={clearFilters} />
          </Box>

          <Box ref={contentPaneRef} flex="1" minW={0} p={{ base: 4, md: 6 }} bg="bg.canvas" overflowY="auto">
            <Outlet />
          </Box>
        </Flex>
      )}
    </Flex>
  );
}
