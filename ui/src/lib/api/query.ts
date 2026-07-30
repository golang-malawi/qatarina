import createFetchClient, { Middleware } from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "./v1";
import { getApiEndpoint } from "@/common/request";
import createAuthHeaders from "@/hooks/useAuthHeaders";
import { setStoredUser } from "@/context/UserStorage";

const middleware: Middleware = {
  async onRequest({ request }) {
    const headers = createAuthHeaders();
    Object.entries(headers).forEach(([key, value]) => {
      request.headers.set(key, value as string);
    });
    return request;
  },
  async onResponse({ response }) {
    if (response.status === 401) {
      setStoredUser(null);
      window.location.href = "/login";
    }
    return response;
  },
};

// Raw fetch client
export const apiClient = createFetchClient<paths>({
  baseUrl: getApiEndpoint(),
});
apiClient.use(middleware);

// React Query wrapper
const $api = createClient(apiClient);
export default $api;

export function buildApiUrl(
  path: string,
  params?: { path?: Record<string, string | number> }
): string {
  let url = path;
  if (params?.path) {
    Object.entries(params.path).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
    });
  }
  return `${getApiEndpoint()}${url}`;
}

export async function executeTestCase(testCaseID: string, testPlanID: string, runner: string) {
  return apiClient.POST("/v1/test-cases/{test_case_id}/execute", {
    params: { path: { test_case_id: testCaseID } },
    body: { testPlanID, runner },
  });
}

export function useTestPlanTestCasesQuery(testPlanID: number) {
  return $api.useQuery("get", "/v1/test-plans/{testPlanID}/test-cases", {
    params: { path: { testPlanID } },
  });
}

export async function downloadReport(projectID: string, reportID: string): Promise<Blob> {
  const res = await apiClient.GET("/v1/projects/{projectID}/reports/{reportID}/download" as any, {
    params: { path: { projectID, reportID } },
  });

  if (!res.response.ok) {
    throw new Error("Failed to download report");
  }

  return await res.response.blob();
}

export function viewReport(projectID: string, reportID: string): string {
  return buildApiUrl("/v1/projects/{projectID}/reports/{reportID}/view", {
    path: { projectID, reportID },
  });
}

export async function viewReportBlob(projectID: string, reportID: string): Promise<Blob> {
  const res = await apiClient.GET("/v1/projects/{projectID}/reports/{reportID}/view" as any, {
    params: { path: { projectID, reportID } },
  });

  if (!res.response.ok) {
    throw new Error("Failed to view report");
  }

  return await res.response.blob();
}
