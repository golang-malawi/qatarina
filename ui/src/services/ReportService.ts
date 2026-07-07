import { apiClient } from "@/lib/api/query";
import $api from "@/lib/api/query";
import type { components } from "@/lib/api/v1";

export type Report = components["schemas"]["schema.ReportResponse"];
export type ReportListResponse = components["schemas"]["schema.ReportListResponse"];
export type CreateReportRequest = components["schemas"]["schema.CreateReportRequest"];

export function useReportsQuery(projectID: string) {
  return $api.useQuery("get", "/v1/projects/{projectID}/reports", {
    params: { path: { projectID } },
  });
}

export function useCreateReportMutation() {
  return $api.useMutation("post", "/v1/projects/{projectID}/reports");
}

export function useDeleteReportMutation() {
  return $api.useMutation("delete", "/v1/projects/{projectID}/reports/{reportID}");
}

export async function getReports(projectID: string): Promise<ReportListResponse> {
  const res = await apiClient.request(
    "get",
    "/v1/projects/{projectID}/reports",
    { params: { path: { projectID } } }
  );
  return res.data as ReportListResponse;
}

export async function createReport(projectID: string, data: CreateReportRequest): Promise<Report> {
  const res = await apiClient.request(
    "post",
    "/v1/projects/{projectID}/reports",
    { params: { path: { projectID } }, body: data }
  );
  return res.data as Report;
}

export async function deleteReport(projectID: string, reportID: string): Promise<void> {
  await apiClient.request(
    "delete",
    "/v1/projects/{projectID}/reports/{reportID}",
    { params: { path: { projectID, reportID } } }
  );
}

// Download report (returns Blob)
export async function downloadReport(projectID: string, reportID: string): Promise<Blob> {
  const res = await apiClient.request(
    "get",
    "/v1/projects/{projectID}/reports/{reportID}/download" as any,
    { params: { path: { projectID, reportID } } }
  );
  return res.response.blob();
}
