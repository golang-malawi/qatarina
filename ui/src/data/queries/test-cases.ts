import {
  findTestCaseAll,
  findTestCaseById,
  findTestCasesByProjectId,
} from "@/services/TestCaseService";
import { queryOptions } from "@tanstack/react-query";

export const findTestCaseAllQueryOptions = queryOptions({
  queryKey: ["testCases"],
  queryFn: () => findTestCaseAll(),
});

export const findTestCaseByIdQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["projectTestCases", id],
    queryFn: () => findTestCaseById(id),
  });

export const testCasesByProjectIdQueryOptions = (projectId: string) =>
  queryOptions({
    queryKey: ["projectTestCasesByProject", projectId],
    queryFn: () => findTestCasesByProjectId(projectId),
  });
