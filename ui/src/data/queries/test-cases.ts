import $api from "@/lib/api/query";
import {
  getTestCases,
  getTestCaseById,
} from "@/services/TestCaseService";
import { queryOptions } from "@tanstack/react-query";

export const findTestCaseAllQueryOptions = queryOptions({
  queryKey: ["testCases"],
  queryFn: () => getTestCases(),
});

export const findTestCaseByIdQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["projectTestCases", id],
    queryFn: () => getTestCaseById(id),
  });

export const testCasesByProjectIdQueryOptions = (projectID: string) =>
  $api.queryOptions("get", "/v1/projects/{projectID}/test-cases", {
    params: { path: { projectID } },
  });
