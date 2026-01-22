import $api from "@/lib/api/query";
import {
  getTestCases,
  getTestCaseById,
  getInboxTestCases,
} from "@/services/TestCaseService";
import { queryOptions } from "@tanstack/react-query";
import { components} from "@/lib/api/v1";
import { _includes } from "zod/v4/core";

type TestCaseListResponse = components["schemas"]["schema.TestCaseListResponse"];
type AssignedTestCaseListResponse = components["schemas"]["schema.AssignedTestCaseListResponse"];
type AssignedTestCase = components["schemas"]["schema.AssignedTestCase"];

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

export const testCasesByProjectIdQueryOptions = (projectID: string) =>
  $api.queryOptions("get", "/v1/projects/{projectID}/test-cases", {
    params: { path: { projectID } },
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