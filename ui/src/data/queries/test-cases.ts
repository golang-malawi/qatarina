import $api from "@/lib/api/query";
import { getTestCaseById, getInboxTestCases } from "@/services/TestCaseService";
import { queryOptions } from "@tanstack/react-query";
import { components} from "@/lib/api/v1";

type AssignedTestCaseListResponse = components["schemas"]["schema.AssignedTestCaseListResponse"];
type AssignedTestCase = components["schemas"]["schema.AssignedTestCase"];

export type TestCaseListQueryParams = {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  kind?: string;
  isDraft?: boolean;
};

export const findTestCaseAllQueryOptions = (params?: TestCaseListQueryParams) =>
  $api.queryOptions("get", "/v1/test-cases", {
    params: { query: params },
  });

export const findTestCaseInboxQueryOptions = queryOptions({
  queryKey: ["testCases", "inbox"],
  queryFn: async (): Promise<AssignedTestCaseListResponse> => {
    const res = await getInboxTestCases();
    return (res?.data ?? res) as AssignedTestCaseListResponse;
  },
});

export const findTestCaseInboxByIdQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["testCases", "inbox", id],
    queryFn: async (): Promise<AssignedTestCase> => {
      const res = await getInboxTestCases();
      const response = (res?.data ?? res) as AssignedTestCaseListResponse;

      const match = response.test_cases?.find((tc: AssignedTestCase) => tc.id === id);
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
  params?: TestCaseListQueryParams
) =>
  $api.queryOptions("get", "/v1/projects/{projectID}/test-cases", {
    params: { path: { projectID }, query: params },
  });

export const findTestCaseSummaryQueryOptions = $api.queryOptions(
  "get",
  "/v1/me/test-cases/summary",
  {}
);

export function findInboxTestCasesQueryOptions() {
  return queryOptions({
    queryKey: ["test-cases", "inbox"],
    queryFn: () => getInboxTestCases(),
  }); 
}
