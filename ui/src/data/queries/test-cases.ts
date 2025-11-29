import $api from "@/lib/api/query";
import {
  getTestCases,
  getTestCaseById,
  getInboxTestCases,
} from "@/services/TestCaseService";
import { queryOptions } from "@tanstack/react-query";
import { components } from "@/lib/api/v1";

type TestCaseListResponse = components["schemas"]["schema.TestCaseListResponse"];
type TestCaseResponse = components["schemas"]["schema.TestCaseResponse"];

type AssignedTestCaseListResponse = components["schemas"]["schema.AssignedTestCaseListResponse"];

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
    queryFn: async (): Promise<TestCaseResponse> => {
      const res = await getTestCaseById(id);
      return (res?.data ?? res) as TestCaseResponse;
    },
  });

export const testCasesByProjectIdQueryOptions = (projectID: string) =>
  $api.queryOptions("get", "/v1/projects/{projectID}/test-cases", {
    params: { path: { projectID } },
  });
