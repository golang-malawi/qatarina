import { apiClient } from "@/lib/api/query";
import $api from "@/lib/api/query";
import type { components } from "@/lib/api/v1";

export function useTestCasesQuery() {
  return $api.useQuery("get", "/v1/test-cases");
}

export function useTestCaseQuery(testCaseID: string) {
  return $api.useQuery("get", "/v1/test-cases/{testCaseID}", { params: { path: { testCaseID } } });
}

export function useCreateTestCaseMutation() {
  return $api.useMutation("post", "/v1/test-cases");
}

export function useProjectTestCasesQuery(projectID: string) {
  return $api.useQuery("get", "/v1/projects/{projectID}/test-cases", { params: { path: { projectID } } });
}

export async function getTestCases() {
  return apiClient.request("get", "/v1/test-cases");
}

export async function getInboxTestCases(){
  return apiClient.request("get", "/v1/me/test-cases/inbox", {}) 
}

export async function getTestCasesByTestPlanID(testPlanID: string) {
  return apiClient.request("get", "/v1/test-plans/{testPlanID}/test-cases", {
    params: { path: { testPlanID } },
  });
}

export async function getTestCaseById(testCaseID: string) {
  return apiClient.request("get", "/v1/test-cases/{testCaseID}", { params: { path: { testCaseID } } });
}

export async function createTestCase(data: components["schemas"]["schema.CreateTestCaseRequest"]) {
  return apiClient.request("post", "/v1/test-cases", { body: data });
}