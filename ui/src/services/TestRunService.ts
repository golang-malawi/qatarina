import { apiClient } from "@/lib/api/query";

export type CommitTestRunPayload = {
  test_run_id: string;
  result_state: "passed" | "failed";
  actual_result: string;
  notes?: string;
  expected_result?: string;
  environment_id?: number;
  tested_on: string;
  is_closed: boolean;
};

export async function executeTestRun(testRunID: string, payload: CommitTestRunPayload) {
  return apiClient.request("post", "/v1/test-runs/{testRunID}/commit", {
    params: { path: { testRunID } },
    body: payload,
  });
}

export async function getTestRunsByPlan(testPlanID: string) {
  const res = await apiClient.request("get", "/v1/test-plans/{testPlanID}/test-runs", {
    params: { path: { testPlanID } },
  });
  return res.data;
}

export async function closeTestRun(testRunID: string) {
  return apiClient.request("post", "/v1/test-runs/{testRunID}/close", {
    params: { path: { testRunID } },
  });
}
