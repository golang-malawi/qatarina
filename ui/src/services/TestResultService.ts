// import { apiClient } from "@/lib/api/query";

// type ExecuteTestCasePayload = {
//   status: "passed" | "failed";
//   result: string;
//   executed_by: number;
//   notes?: string;
// };

// export async function executeTestCase(
//   test_case_id: string,
//   payload: ExecuteTestCasePayload
// ) {
//   return apiClient.request(
//     "post",
//     "/v1/test-cases/{test_case_id}/execute",
//     {
//       params: { path: { test_case_id } },
//       body: payload,
//     }
//   );
// }
