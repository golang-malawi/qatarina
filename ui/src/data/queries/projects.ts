import { findAllProjects } from "@/services/ProjectService";
import { queryOptions } from "@tanstack/react-query";

export const allProjectsQueryOptions = queryOptions({
  queryKey: ["projects", {}],
  queryFn: () => findAllProjects(),
});
