import $api from "@/lib/api/query";
import {
  getTestCaseById,
  getInboxTestCases,
  getInboxUnseenCount,
} from "@/services/TestCaseService";
import { QueryClient, queryOptions } from "@tanstack/react-query";
import { components } from "@/lib/api/v1";

type AssignedTestCaseListResponse =
  components["schemas"]["schema.AssignedTestCaseListResponse"];
type AssignedTestCase = components["schemas"]["schema.AssignedTestCase"];

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

// Shares the ["testCases", "inbox"] prefix so invalidating the inbox also refreshes the count
export const findInboxUnseenCountQueryOptions = queryOptions({
  queryKey: ["testCases", "inbox", "unseen-count"],
  queryFn: async (): Promise<number> => {
    const res = await getInboxUnseenCount();
    return res?.data?.unseen_count ?? 0;
  },
  refetchInterval: 60_000,
});

export const findTestCaseInboxByIdQueryOptions =(id: string) =>
  queryOptions({
    queryKey: ["testCases", "inbox", id],
    queryFn: async (): Promise<AssignedTestCase> => {
      const res = await getInboxTestCases({ includeClosed: true });
      const response = (res?.data ?? res) as AssignedTestCaseListResponse;

      const match = response.test_cases?.find(
        (tc: AssignedTestCase) => tc.id === id,
      );
      if (!match) {
        throw new Error(`Inbox test case ${id} not found`);
      }
      return match;
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

// Backend caps pageSize at 100
const FETCH_ALL_PAGE_SIZE = 100;

type ProjectTestCase = components["schemas"]["schema.TestCaseResponse"];

/** Fetches every test case in a project: the first page, then the rest in parallel. */
export async function fetchAllProjectTestCases(
  queryClient: QueryClient,
  projectID: string,
  params?: Omit<TestCaseListQueryParams, "page" | "pageSize">,
): Promise<ProjectTestCase[]> {
  const fetchPage = (page: number) =>
    queryClient.fetchQuery({
      ...testCasesByProjectIdQueryOptions(projectID, {
        ...params,
        page,
        pageSize: FETCH_ALL_PAGE_SIZE,
      }),
      staleTime: 30_000,
    });

  const first = await fetchPage(1);
  const total = first?.pagination?.total ?? 0;
  const pageCount = Math.ceil(total / FETCH_ALL_PAGE_SIZE);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, pageCount - 1) }, (_, i) => fetchPage(i + 2)),
  );
  return [first, ...rest].flatMap((res) => res?.test_cases ?? []);
}

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
