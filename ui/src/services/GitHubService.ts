import { apiClient } from "@/lib/api/query";

export interface GitHubIssue {
  id: number;
  title: string;
  body: string;
  labels: Array<{ name: string }>;
  url: string;
  type: "issue";
}

export interface GitHubPullRequest {
  id: number;
  title: string;
  body: string;
  labels: Array<{ name: string }>;
  url: string;
  type: "pull_request";
}

export type GitHubItem = GitHubIssue | GitHubPullRequest;

/**
 * Parse GitHub URL (https://github.com/owner/repo) into owner/repo format
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split("/").filter((p) => p);

    if (parts.length >= 2) {
      return { owner: parts[0], repo: parts[1] };
    }
  } catch {
    return null;
  }
  return null;
}

function handleGitHubApiError(res: any, defaultMessage: string): never {
  if (res.error) {
    const error = new Error(res.error.detail || defaultMessage) as Error & {
      installUrl?: string;
    };
    if (res.error.context?.install_url) {
      error.installUrl = res.error.context.install_url;
    }
    throw error;
  }
  throw new Error(defaultMessage);
}

/**
 * List GitHub issues from a repository
 */
export async function listGitHubIssues(project: string): Promise<GitHubIssue[]> {
  const res = await apiClient.request("post", "/v1/github/issues", {
    body: { project },
  });

  if (res.error) {
    handleGitHubApiError(res, "Failed to fetch GitHub issues");
  }

  const issues = (res.data as any)?.issues || [];
  return issues.map((issue: any) => ({
    ...issue,
    type: "issue",
  }));
}

/**
 * List GitHub pull requests from a repository
 */
export async function listGitHubPullRequests(
  owner: string,
  repo: string
): Promise<GitHubPullRequest[]> {
  const res = await apiClient.request("post", "/v1/github/pull-requests", {
    body: { project: `${owner}/${repo}` },
  });

  if (res.error) {
    handleGitHubApiError(res, "Failed to fetch GitHub pull requests");
  }

  const prs = (res.data as any)?.pull_requests || [];
  return prs.map((pr: any) => ({
    ...pr,
    type: "pull_request",
  }));
}

/**
 * Import GitHub issues as test cases
 */
export async function importGitHubIssuesAsTestCases(
  project: string,
  projectID: number,
  ids: number[] = []
): Promise<any> {
  const res = await apiClient.request(
    "post",
    "/v1/test-cases/github-import/issues",
    {
      body: { project, project_id: projectID, ids },
    }
  );

  if (res.error) {
    handleGitHubApiError(res, "Failed to import GitHub issues");
  }

  return res.data;
}

/**
 * Import GitHub pull requests as test cases
 */
export async function importGitHubPullRequestsAsTestCases(
  project: string,
  projectID: number,
  ids: number[] = []
): Promise<any> {
  const res = await apiClient.request(
    "post",
    "/v1/test-cases/github-import/pull-requests",
    {
      body: { project, project_id: projectID, ids },
    }
  );

  if (res.error) {
    handleGitHubApiError(res, "Failed to import GitHub pull requests");
  }

  return res.data;
}

/**
 * Check GitHub health/integration status
 */
export async function checkGitHubHealth(): Promise<string> {
  const res = await apiClient.request("get", "/v1/github/health");

  if (res.error) {
    throw new Error(res.error.detail || "GitHub integration unhealthy");
  }

  return (res.data as any)?.status || "unknown";
}
