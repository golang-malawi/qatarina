import { apiClient } from "@/lib/api/query";
import $api from "@/lib/api/query";
import type { components } from "@/lib/api/v1";

export function useTestCasesQuery() {
  return $api.useQuery("get", "/v1/test-cases");
}

export function useTestCaseQuery(testCaseID: string) {
  return $api.useQuery("get", "/v1/test-cases/{testCaseID}", {
    params: { path: { testCaseID } },
  });
}

export function useCreateTestCaseMutation() {
  return $api.useMutation("post", "/v1/test-cases");
}

export function useProjectTestCasesQuery(projectID: string) {
  return $api.useQuery("get", "/v1/projects/{projectID}/test-cases", {
    params: { path: { projectID } },
  });
}

export async function getTestCases() {
  return apiClient.request("get", "/v1/test-cases");
}

export async function getInboxTestCases() {
  return apiClient.request("get", "/v1/me/test-cases/inbox", {});
}

export async function getTestCasesByTestPlanID(testPlanID: string) {
  return apiClient.request("get", "/v1/test-plans/{testPlanID}/test-cases", {
    params: { path: { testplanID: testPlanID } },
  });
}

export async function getTestCaseById(testCaseID: string) {
  return apiClient.request("get", "/v1/test-cases/{testCaseID}", {
    params: { path: { testCaseID } },
  });
}

export async function createTestCase(
  data: components["schemas"]["schema.CreateTestCaseRequest"]
) {
  return apiClient.request("post", "/v1/test-cases", { body: data });
}


export async function importTestCasesFromFile(
  projectId: string,
  file: File
) {
  const formData = new FormData();
  formData.append("projectID", projectId);
  formData.append("file", file);

  try {
    const res = await apiClient.request(
      "post",
      "/v1/test-cases/import-file",
      {
        params: { path: { formData: "" } },
        body: formData as any,
      }
    );
    if (
      (res as any)?.success === false ||
      (res as any)?.error ||
      (res as any)?.errors?.length
    ) {
      throw new Error(
        (res as any)?.message ||
          (res as any)?.error ||
          "Failed to import test cases"
      );
    }

    return res;
  } catch (err: any) { 
    const message =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to import test cases";

    throw new Error(message);
  }
}

export async function markTestCaseAsDraft(testCaseID:string) {
  return apiClient.request("post", "/v1/test-cases/{testCaseID}/mark-draft",{
    params: {path: {testCaseID}},
  });
  
}
export async function unmarkTestCaseAsDraft(testCaseID:string) {
  return apiClient.request("post", "/v1/test-cases/{testCaseID}/unmark-draft",{
    params: {path: {testCaseID}},
  });
  
}