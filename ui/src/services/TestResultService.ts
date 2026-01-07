import { apiClient } from "@/lib/api/query";

type ExecuteTestCasePayload = {
  status: "passed" | "failed";
  result: string;
  executed_by: number;
  notes?: string;
};

export async function executeTestCase(
  testCaseID: string,
  payload: ExecuteTestCasePayload
) {
  return apiClient.request(
    "post",
    "/v1/test-cases/{testCaseID}/execute",
    {
      params: { path: { testCaseID } },
      body: payload,
    }
  );
}