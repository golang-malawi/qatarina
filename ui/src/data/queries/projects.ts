import $api from "@/lib/api/query";

export const findProjectsQueryOptions = $api.queryOptions("get", "/v1/projects");

export const findProjectByIdQueryOptions = (id: string) => 
    $api.queryOptions("get", "/v1/projects/{projectID}", {
        params: {path: {projectID: id}},
    });