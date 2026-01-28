import { apiClient } from "@/lib/api/query";
import type { operations } from "@/lib/api/v1";

export type Module = {
  id: string;
  name: string;
  code: string;
  type: string;
  priority: number;
  created_at: string;
  updated_at: string;
  description: string;
  project_id: number;
};

export default class ModuleService {
  async getAllModules(): Promise<Module[]> {
    const res = await apiClient.request("get", "/v1/modules");
    const apiModules =
      (res.data as unknown as { modules: any[] }).modules ?? [];
    return apiModules.map((mod) => ({
      id: String(mod.ID),
      project_id: mod.ProjectID,
      name: mod.Name,
      code: mod.Code,
      type: mod.Type,
      priority: mod.Priority,
      description: mod.Description,
      created_at: mod.CreatedAt?.Time || "",
      updated_at: mod.UpdatedAt?.Time || "",
    }));
  }

  async getModuleById(id: string): Promise<Module> {
    const res = await apiClient.request("get", "/v1/modules/{moduleID}", {
      params: { path: { moduleID: id } },
    });
    return res.data as unknown as Module;
  }

  async createModule(
    data: operations["CreateModule"]["requestBody"]["content"]["application/json"],
  ) {
    const res = await apiClient.request("post", "/v1/modules", { body: data });
    return res.data as unknown;
  }

  async updateModule(
    id: string,
    data: operations["UpdateModule"]["requestBody"]["content"]["application/json"],
  ) {
    const res = await apiClient.request("post", "/v1/modules/{moduleID}", {
      params: { path: { moduleID: id } },
      body: data,
    });
    return res.data as unknown;
  }

  async deleteModule(id: string) {
    const res = await apiClient.request("delete", "/v1/modules/{moduleID}", {
      params: { path: { moduleID: id } },
    });
    return res.data as unknown;
  }

  async getModulesByProjectId(projectId: string): Promise<Module[]> {
    const res = await apiClient.request(
      "get",
      "/v1/projects/{projectID}/modules",
      {
        params: { path: { projectID: projectId } },
      },
    );
    const apiModules = res.data as unknown as any[];
    return apiModules.map((mod) => ({
      id: String(mod.ID),
      name: mod.Name,
      code: mod.Code,
      type: mod.Type,
      priority: mod.Priority,
      description: mod.Description,
      project_id: mod.ProjectID,
      created_at: mod.CreatedAt?.Time || "",
      updated_at: mod.UpdatedAt?.Time || "",
    }));
  }
}
