import $api from "@/lib/api/query";
import {
  getTestCaseById,
  getInboxTestCases,
  getInboxTestCaseById,
  getInboxUnseenCount,
  getInboxNavigation,
  getInboxFilterOptions,
} from "@/services/TestCaseService";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { components } from "@/lib/api/v1";

type AssignedTestCaseListResponse =
  components["schemas"]["schema.AssignedTestCaseListResponse"];
type AssignedTestCase = components["schemas"]["schema.AssignedTestCase"];
type InboxNavigationResponse =
  components["schemas"]["schema.InboxNavigationResponse"];
type InboxFilterOptionsResponse =
  components["schemas"]["schema.InboxFilterOptionsResponse"];

export type TestCaseListQueryParams = {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  kind?: string;
  isDraft?: boolean;
  module?: string;
};

export const findTestCaseAllQueryOptions = (params?: TestCaseListQueryParams) =>
  $api.queryOptions("get", "/v1/test-cases", {
    params: { query: params },
  });

export const findTestCaseInboxQueryOptions = (
  includeClosed: boolean,
  page: number = 1,
  pageSize: number = 25,
) =>
  queryOptions({
    queryKey: ["testCases", "inbox", includeClosed, page, pageSize],
    queryFn: async (): Promise<AssignedTestCaseListResponse> => {
      const res = await getInboxTestCases({ includeClosed, page, pageSize });
      return (res?.data ?? res) as AssignedTestCaseListResponse;
    },
  });

// Filters for the inbox list, applied by the server so they cover the whole inbox
export type InboxFilters = {
  includeClosed: boolean;
  search: string;
  projectId: string;
  environmentId: string;
  module: string;
};

export const emptyInboxFilters: InboxFilters = {
  includeClosed: false,
  search: "",
  projectId: "",
  environmentId: "",
  module: "",
};

export function hasActiveInboxFilters(filters: InboxFilters) {
  return Boolean(
    filters.search || filters.projectId || filters.environmentId || filters.module || filters.includeClosed,
  );
}

export const INBOX_PAGE_SIZE = 50;

// The inbox list loads page by page as you scroll. Used by both the list and grid views
// (same key, so they share the cache). Keeps the ["testCases", "inbox"] prefix so
// invalidating the inbox refreshes it.
export const inboxListInfiniteQueryOptions = (filters: InboxFilters) =>
  infiniteQueryOptions({
    queryKey: ["testCases", "inbox", "list", filters],
    queryFn: async ({ pageParam }): Promise<AssignedTestCaseListResponse> => {
      const res = await getInboxTestCases({ ...filters, page: pageParam, pageSize: INBOX_PAGE_SIZE });
      return (res?.data ?? res) as AssignedTestCaseListResponse;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const total = lastPage?.pagination?.total ?? 0;
      const loaded = allPages.reduce((acc, page) => acc + (page?.test_cases?.length ?? 0), 0);
      return loaded < total ? allPages.length + 1 : undefined;
    },
  });

export const findInboxFilterOptionsQueryOptions = (includeClosed: boolean) =>
  queryOptions({
    queryKey: ["testCases", "inbox", "filter-options", includeClosed],
    queryFn: async (): Promise<InboxFilterOptionsResponse> => {
      const res = await getInboxFilterOptions(includeClosed);
      return (res?.data ?? { projects: [], environments: [], modules: [] }) as InboxFilterOptionsResponse;
    },
  });

// Shares the ["testCases", "inbox"] prefix so invalidating the inbox also refreshes the count
export const findInboxUnseenCountQueryOptions = queryOptions({
  queryKey: ["testCases", "inbox", "unseen-count"],
  queryFn: async (): Promise<number> => {
    const res = await getInboxUnseenCount();
    return res?.data?.unseen_count ?? 0;
  },
  refetchInterval: 60_000,
});

// An inbox row is a test case in a test plan. Without a plan the server picks the
// open assignment of the test case.
export const findTestCaseInboxByIdQueryOptions = (id: string, testPlanID?: number) =>
  queryOptions({
    queryKey: ["testCases", "inbox", id, testPlanID ?? 0],
    queryFn: async (): Promise<AssignedTestCase> => {
      // Fetch the test case directly so it is found no matter which inbox page it is on
      const res = await getInboxTestCaseById(id, testPlanID);
      const match = (res?.data ?? res) as AssignedTestCase | undefined;
      if (!match?.id) {
        throw new Error(`Inbox test case ${id} not found`);
      }
      return match;
    },
  });

// Previous/next rows and position in the inbox, in inbox order and limited by the same
// filters as the list. An inbox row is a test case in a test plan. Shares the
// ["testCases", "inbox"] prefix so it refreshes along with the inbox.
export const findInboxNavigationQueryOptions = (
  id: string,
  testPlanID: number,
  filters: InboxFilters = emptyInboxFilters,
) =>
  queryOptions({
    queryKey: ["testCases", "inbox", id, testPlanID, "navigation", filters],
    queryFn: async (): Promise<InboxNavigationResponse> => {
      const res = await getInboxNavigation(id, testPlanID, filters);
      return (res?.data ?? res) as InboxNavigationResponse;
    },
  });

export const findTestCaseByIdQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["projectTestCases", id],
    queryFn: async (): Promise<AssignedTestCase> => {
      const res = await getTestCaseById(id);
      return (res?.data ?? res) as AssignedTestCase;
    },
  });

export const testCasesByProjectIdQueryOptions = (
  projectID: string,
  params?: TestCaseListQueryParams,
) =>
  $api.queryOptions("get", "/v1/projects/{projectID}/test-cases", {
    params: { path: { projectID }, query: params },
    queryKey: [
      "projectTestCases",
      projectID,
      params?.page,
      params?.pageSize,
      params?.sortBy,
      params?.sortOrder,
      params?.search,
      params?.kind,
      params?.isDraft,
    ],
  });

export const findTestCaseSummaryQueryOptions = $api.queryOptions(
  "get",
  "/v1/me/test-cases/summary",
  {},
);

export function findInboxTestCasesQueryOptions() {
  return queryOptions({
    queryKey: ["test-cases", "inbox"],
    queryFn: () => getInboxTestCases(),
  });
}
