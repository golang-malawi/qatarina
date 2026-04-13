import { apiClient } from "@/lib/api/query";
import type {components} from "@/lib/api/v1"

type ExecuteTestRunPayload = components["schemas"]["schema.ExecuteTestRunRequest"];

export async function executeTestRun(testRunID: string, payload: ExecuteTestRunPayload){
    return apiClient.request("post", "/v1/test-runs/{testRunID}/execute", {
        params: {path: {testRunID}},
        body: payload,
    });
}

export async function getTestRunsByPlan(testPlanID: string) {
    const res = await apiClient.request("get", "/v1/test-plans/{testPlanID}/test-runs", {
        params: { path: { testPlanID: testPlanID } },
    });
    return res.data;
}

export async function closeTestRun(testRunID: string) {
    return apiClient.request("post", "/v1/test-runs/{testRunID}/close", {
        params: { path: { testRunID } },
    });
}

