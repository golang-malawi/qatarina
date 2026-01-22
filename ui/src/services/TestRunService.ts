import { apiClient } from "@/lib/api/query";
import type {components} from "@/lib/api/v1"

type ExecuteTestRunPayload = components["schemas"]["schema.ExecuteTestRunRequest"];

export async function executeTestRun(testRunID: string, payload: ExecuteTestRunPayload){
    return apiClient.request("post", "/v1/test-runs/{testRunID}/execute", {
        params: {path: {testRunID}},
        body: payload,
    });
}