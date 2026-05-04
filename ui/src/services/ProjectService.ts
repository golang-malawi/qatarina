import { apiClient } from "@/lib/api/query";
import $api from "@/lib/api/query";
import type { components } from "@/lib/api/v1";

export function useProjectQuery(projectID: string) {
  return $api.useQuery("get", "/v1/projects/{projectID}", { params: { path: { projectID } } });
}

export function useProjectsQuery() {
  return $api.useQuery("get", "/v1/projects");
}

export function useCreateProjectMutation() {
  return $api.useMutation("post", "/v1/projects");
}

export async function getProjectById(projectID: string) {
  return apiClient.request("get", "/v1/projects/{projectID}", { params: { path: { projectID } } });
}

export async function createProject(data: components["schemas"]["schema.NewProjectRequest"]) {
  return apiClient.request("post", "/v1/projects", { body: data });
}

export function useDeleteProjectMutation(){
  return $api.useMutation("delete", "/v1/projects/{projectID}");
}

export function useUpdateProjectMutation(){
  return $api.useMutation("post", "/v1/projects/{projectID}");
}

export function useArchiveProjectMutation(){
  return $api.useMutation("post", "/v1/projects/{projectID}/archive");
}

export function useUnarchiveProjectMutation(){
  return $api.useMutation("post", "/v1/projects/{projectID}/unarchive");
}

export function useProjectTestCaseTemplateQuery(projectID: number) {
  return $api.useQuery("get", "/v1/projects/{projectID}/test-case-template", { 
    params: { path: { projectID } },
   });
}

export function useAddProjectTestCaseTemplateMutation() {
  return $api.useMutation("post", "/v1/projects/{projectID}/test-case-template");
}

export async function getProjectTemplate(projectID: number) {
  return apiClient.request("get", "/v1/projects/{projectID}/test-case-template", {
    params: { path: { projectID } },
  });
}

export async function addProjectTemplate(
  projectID: number,
  data: { project_id: number; test_case_template: string }
) {
  return apiClient.request("post", "/v1/projects/{projectID}/test-case-template", {
    params: { path: { projectID } },
    body: data,
  });
}