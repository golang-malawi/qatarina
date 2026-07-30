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

export type CreateTestRunPayload = {
  project_id: number;
  test_plan_id: number;
  test_case_id: string;
  owner_id: number;
  tested_by_id: number;
  assigned_to_id?: number;
  code?: string;
  created_at?: string;
  updated_at?: string;
  environment_id?: number;
  runner?: string;
  script_path?: string;
  actual_result?: string;
  expected_result?: string;
  notes?: string;
  result_state?: "passed" | "failed";
  tested_on?: string;
};

export type TestRunResponse = {
  id: string;
  project_id: number;
  test_plan_id: number;
  test_case_id: string;
  tested_by_id: number;
  code: string;
  result_state: string;
  is_closed: boolean;
  notes: string;
  actual_result: string;
  expected_result: string;
  tested_on: string;
  test_case_title: string;
  executed_by: string;
  environment_id: number;
};

export async function createTestRun(payload: CreateTestRunPayload): Promise<TestRunResponse> {
  const response = await apiClient.request("post", "/v1/test-runs", {
    body: payload,
  });

  if (response.error) {
    throw new Error(response.error.detail || "Failed to create test run");
  }

  return response.data as TestRunResponse;
}
