import { apiClient } from "@/lib/api/query";
import $api from "@/lib/api/query";

export function useProjectSummaryQuery(projectId: string) {
    return $api.useQuery("get", "/v1/projects/{projectID}/summary", {
        params: {path: {projectID: projectId}},
    });
}

    export async function getProjectSummary(projectId: string) {
        return apiClient.request("get", "/v1/projects/{projectID}/summary", {
            params: {path: {projectID: projectId}},
        });
    }
    