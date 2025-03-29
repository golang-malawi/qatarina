import { findAllTestPlans } from "@/services/TestPlanService";
import { queryOptions } from "@tanstack/react-query";

export const findTestPlansAllQueryOptions = queryOptions({
  queryKey: ["testPlans"],
  queryFn: () => findAllTestPlans(),
});
