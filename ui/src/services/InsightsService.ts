import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/query";

// Data the Insights page needs, fetched in a single GraphQL request.
// See docs/graphql.md and internal/graphqlapi/schema.graphql.

export type InsightsTestCase = {
  id: string;
  code: string;
  title: string;
  featureOrModule: string | null;
  isDraft: boolean;
};

export type InsightsTestPlan = {
  id: string;
  kind: string;
  description: string;
  isComplete: boolean;
  scheduledEndAt: string;
  numTestCases: number;
  passedCount: number;
  failedCount: number;
  pendingCount: number;
};

export type TestRunState = "pending" | "passed" | "failed" | "blocked";

export type InsightsTestRun = {
  id: string;
  resultState: TestRunState;
  testedOn: string;
  testCaseId: string;
  testPlanId: string | null;
};

export type ProjectInsightsData = {
  project: {
    id: string;
    title: string;
    testCases: InsightsTestCase[];
    testPlans: InsightsTestPlan[];
    testRuns: InsightsTestRun[];
  } | null;
};

const PROJECT_INSIGHTS_QUERY = /* GraphQL */ `
  query ProjectInsights($projectId: ID!) {
    project(id: $projectId) {
      id
      title
      testCases { id code title featureOrModule isDraft }
      testPlans {
        id kind description isComplete scheduledEndAt
        numTestCases passedCount failedCount pendingCount
      }
      testRuns { id resultState testedOn testCaseId testPlanId }
    }
  }
`;

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

/** POSTs a query to /graphql using the shared client (auth header + 401 handling). */
export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const res = await apiClient.POST("/graphql" as any, {
    body: { query, variables } as any,
  });
  const body = res.data as GraphQLResponse<T> | undefined;

  if (!res.response.ok || !body) {
    throw new Error(`GraphQL request failed (HTTP ${res.response.status})`);
  }
  if (body.errors?.length) {
    throw new Error(body.errors.map((e) => e.message).join("; "));
  }
  if (!body.data) {
    throw new Error("GraphQL response contained no data");
  }
  return body.data;
}

export function useProjectInsightsQuery(projectId: string) {
  return useQuery({
    queryKey: ["graphql", "projectInsights", projectId],
    queryFn: () =>
      graphqlRequest<ProjectInsightsData>(PROJECT_INSIGHTS_QUERY, { projectId }),
  });
}
