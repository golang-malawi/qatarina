import { apiClient } from "@/lib/api/query";
import type {components} from "@/lib/api/v1"

type ExecuteTestRunPayload = components["schemas"]["schema.ExecuteTestRunRequest"];

export async function executeTestRun(testRunID: string, payload: ExecuteTestRunPayload){
    const res = await apiClient.request("post", "/v1/test-runs/{testRunID}/execute", {
        params: {path: {testRunID}},
        body: payload,
    });
    return res.data;
}

export async function getTestRunsByPlan(testPlanID: string) {
    const res = await apiClient.request("get", "/v1/test-plans/{testPlanID}/test-runs", {
        params: { path: { testPlanID: testPlanID } },
    });
    return res.data;
}

export async function uploadTestRunAttachment(resultID: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);

    return apiClient.request("post", "/v1/test-runs/{resultID}/attachments", {
        params: { path: { resultID } },
        body: formData as any,
    });
}

export async function getTestRunAttachments(resultID: string) {
    const res = await apiClient.request("get", "/v1/test-runs/{resultID}/attachments", {
        params: { path: { resultID } },
    });
    const data = res.data as
        | components["schemas"]["schema.AttachmentResponse"][]
        | { attachments?: components["schemas"]["schema.AttachmentResponse"][] };

    if (Array.isArray(data)) {
        return data;
    }
    return data.attachments ?? [];
}

export async function closeTestRun(testRunID: string) {
    return apiClient.request("post", "/v1/test-runs/{testRunID}/close", {
        params: { path: { testRunID } },
    });
}

