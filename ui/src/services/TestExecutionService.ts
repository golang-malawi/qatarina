import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/query";
import type { operations } from "@/lib/api/v1";

export async function executeTestCase(
  testCaseID: string,
  testPlanID?: number,
  runner?: string,
): Promise<
  operations["ExecuteTestCase"]["responses"][202]["content"]["application/json"]
> {
  const body: operations["ExecuteTestCase"]["requestBody"]["content"]["application/json"] = {};
  if (testPlanID) body.test_plan_id = testPlanID;
  if (runner) body.runner = runner;

  const response = await apiClient.POST("/v1/test-cases/{test_case_id}/execute", {
    params: { path: { test_case_id: testCaseID } },
    body,
  });

  if (response.error) {
    throw new Error(
      (response.error as any)?.detail ?? "Failed to execute test case",
    );
  }
  if (!response.data) {
    throw new Error("No data returned from executeTestCase");
  }
  return response.data;
}

export function useExecuteTestCaseMutation() {
  return useMutation({
    mutationFn: ({
      testCaseID,
      testPlanID,
      runner,
    }: {
      testCaseID: string;
      testPlanID?: number;
      runner?: string;
    }) => executeTestCase(testCaseID, testPlanID, runner),
  });
}

// NEW: WebSocket connection helper
export function connectToTestExecution(
  testRunID: string,
  onMessage: (msg: { type?: string; content?: string; state?: "passed" | "failed" | "pending" }) => void,
  onError?: (err: Event) => void,
  onClose?: () => void,
): WebSocket {
  const ws = new WebSocket(`ws://localhost:8080/ws/run?testRunID=${testRunID}`);

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      onMessage(msg);
    } catch (e) {
      console.error("Invalid message", e);
    }
  };

  if (onError) ws.onerror = onError;
  if (onClose) ws.onclose = onClose;

  return ws;
}
