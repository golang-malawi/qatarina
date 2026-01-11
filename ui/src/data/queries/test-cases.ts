import $api from "@/lib/api/query";
import {
  getTestCases,
  getTestCaseById,
  getInboxTestCases,
} from "@/services/TestCaseService";
import { queryOptions } from "@tanstack/react-query";
import { components } from "@/lib/api/v1";
import { _includes } from "zod/v4/core";

type TestCaseListResponse = components["schemas"]["schema.TestCaseListResponse"];
type AssignedTestCaseListResponse = components["schemas"]["schema.AssignedTestCaseListResponse"];
type AssignedTestCase = components["schemas"]["schema.AssignedTestCase"];

export type TestCaseSummary = {
  test_case_id: string;
  usage_count: number;
  success_count: number
  failure_count: number;
}

export const findTestCaseAllQueryOptions = queryOptions({
  queryKey: ["testCases"],
  queryFn: async (): Promise<TestCaseListResponse> => {
    const res = await getTestCases();
    // unwrap if your service returns { data }
    return (res?.data ?? res) as TestCaseListResponse;
  },
});

export const findTestCaseInboxQueryOptions = queryOptions({
  queryKey: ["testCases", "inbox"],
  queryFn: async (): Promise<AssignedTestCaseListResponse> => {
    const res = await getInboxTestCases();
    return (res?.data ?? res) as AssignedTestCaseListResponse;
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

export const testCasesByProjectIdQueryOptions = (projectID: string) =>
  $api.queryOptions("get", "/v1/projects/{projectID}/test-cases", {
    params: { path: { projectID } },
  });

  export const findTestCaseSummaryQueryOptions = $api.queryOptions(
  "get",
  "/v1/me/test-cases/summary",
  {}
);
  