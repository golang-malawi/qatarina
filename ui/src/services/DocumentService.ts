import { apiClient } from "@/lib/api/query";
import $api from "@/lib/api/query";

export function useProjectDocumentsQuery(projectID: string | number) {
  const numericProjectId = typeof projectID === "string" ? Number(projectID) : projectID;
  return $api.useQuery("get", "/v1/projects/{projectID}/documents", {
    params: { path: { projectID: numericProjectId } },
  });
}

export async function getProjectDocuments(projectID: string | number) {
  const numericProjectId = typeof projectID === "string" ? Number(projectID) : projectID;
  return apiClient.request("get", "/v1/projects/{projectID}/documents", {
    params: { path: { projectID: numericProjectId } },
  });
}

export function useCreateProjectDocumentMutation() {
  return $api.useMutation("post", "/v1/projects/{projectID}/documents");
}

export async function createProjectDocument(
  projectID: string | number,
  formData: FormData
) {
  const numericProjectId = typeof projectID === "string" ? Number(projectID) : projectID;
  return apiClient.request("post", "/v1/projects/{projectID}/documents", {
    params: { path: { projectID: numericProjectId } },
    body: formData as any,
  });
}

export async function deleteProjectDocument({
  projectID,
  documentID,
}: {
  projectID: string | number;
  documentID: string | number;
}) {
  const numericProjectId = typeof projectID === "string" ? Number(projectID) : projectID;
  const stringDocumentId = String(documentID);

  return apiClient.request("delete", "/v1/projects/{projectID}/documents/{documentID}", {
    params: {
      path: {
        projectID: numericProjectId,
        documentID: stringDocumentId,
      },
    },
  });
}
