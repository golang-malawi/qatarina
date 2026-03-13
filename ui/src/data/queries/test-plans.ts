import { getTestPlans } from "@/services/TestPlanService";
import { queryOptions } from "@tanstack/react-query";
import $api from "@/lib/api/query";

export const findTestPlansAllQueryOptions = queryOptions({
  queryKey: ["testPlans"],
  queryFn: getTestPlans,
});

export const findProjectTestPlansQueryOptions = (projectId: string | number) =>
  $api.queryOptions("get", "/v1/projects/{projectID}/test-plans", {
    params: { path: { projectID: String(projectId) } },
  });
