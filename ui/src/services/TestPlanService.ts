import { apiClient } from "@/lib/api/query";
import $api from "@/lib/api/query";

export function useProjectTestPlansQuery(projectID: string) {
  return $api.useQuery("get", "/v1/projects/{projectID}/test-plans", {
    params: { path: { projectID } },
  });
}

export function useTestPlanQuery(testPlanID: string) {
  return $api.useQuery("get", "/v1/test-plans/{testPlanID}", {
    params: { path: { testPlanID } },
  });
}

export function useCreateTestPlanMutation() {
  return $api.useMutation("post", "/v1/test-plans");
}

export function useDeleteTestPlanMutation() {
  return $api.useMutation("delete", "/v1/test-plans/{testPlanID}");
}

export function useTestPlansQuery() {
  return $api.useQuery("get", "/v1/test-plans");
}

export async function getProjectTestPlans(projectID: string) {
  return apiClient.request("get", "/v1/projects/{projectID}/test-plans", {
    params: { path: { projectID } },
  });
}

export async function getTestPlanById(testPlanID: string) {
  return apiClient.request("get", "/v1/test-plans/{testPlanID}", {
    params: { path: { testPlanID } },
  });
}

export async function createTestPlan(data: any) {
  return apiClient.request("post", "/v1/test-plans", { body: data });
}

export async function deleteTestPlan(testPlanID: string) {
  return apiClient.request("delete", "/v1/test-plans/{testPlanID}", {
    params: { path: { testPlanID } },
  });
}

export async function getTestPlans() {
  return apiClient.request("get", "/v1/test-plans");
}

export async function getTestRuns(testPlanID: string) {
  return apiClient.request("get", "/v1/test-plans/{testPlanID}/test-runs", {
    params: { path: { testplanID: testPlanID } },
  });
}

export async function assignTestersToTestPlan(
  testPlanID: string,
  payload: AssignTestsToPlanPayload
) {
  return apiClient.request(
    "post",
    "/v1/test-plans/{testPlanID}/test-cases",
    {
      params: { path: { testPlanID } },
      body: payload,
    }
  );
}

// export async function removeTestersFromTestPlan(
//   testPlanID: string,
//   userIDs: string[]
// ) {
//   return apiClient.request("post", "/v1/test-plans/{testPlanID}/remove-testers", {
//     params: { path: { testPlanID } },
//     body: { userIDs },
//   });
// }
