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
  parent_module_id: string | null;
};

export type ModuleNode = Module & {
  /** Level in the hierarchy, top-level modules are at level 1 */
  depth: number;
  children: ModuleNode[];
};

// The API returns modules with Go field names (ID, ParentModuleID, ...)
function toModule(mod: any): Module {
  return {
    id: String(mod.ID),
    project_id: mod.ProjectID,
    name: mod.Name,
    code: mod.Code,
    type: mod.Type,
    priority: mod.Priority,
    description: mod.Description,
<<<<<<< HEAD
=======
    parent_module_id: mod.ParentModuleID?.Valid
      ? String(mod.ParentModuleID.Int32)
      : null,
>>>>>>> main
    created_at: mod.CreatedAt?.Time || "",
    updated_at: mod.UpdatedAt?.Time || "",
  };
}

<<<<<<< HEAD
=======
/** Arranges modules into their hierarchy, modules whose parent is missing are treated as top level */
export function buildModuleTree(modules: Module[]): ModuleNode[] {
  const nodes = new Map<string, ModuleNode>(
    modules.map((m) => [m.id, { ...m, depth: 1, children: [] }]),
  );
  const roots: ModuleNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parent_module_id ? nodes.get(node.parent_module_id) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const byPriorityThenName = (a: ModuleNode, b: ModuleNode) =>
    a.priority - b.priority || a.name.localeCompare(b.name);
  const visited = new Set<string>();
  const setDepth = (list: ModuleNode[], depth: number) => {
    list.sort(byPriorityThenName);
    for (const node of list) {
      if (visited.has(node.id)) continue;
      visited.add(node.id);
      node.depth = depth;
      setDepth(node.children, depth + 1);
    }
  };
  setDepth(roots, 1);
  return roots;
}

/** Flattens a module tree depth-first, so each module is followed by its descendants */
export function flattenModuleTree(tree: ModuleNode[]): ModuleNode[] {
  return tree.flatMap((node) => [node, ...flattenModuleTree(node.children)]);
}

/** IDs of the module and every module below it */
export function moduleSubtreeIds(tree: ModuleNode[], moduleId: string): Set<string> {
  const ids = new Set<string>();
  const node = flattenModuleTree(tree).find((n) => n.id === moduleId);
  if (node) {
    flattenModuleTree([node]).forEach((n) => ids.add(n.id));
  }
  return ids;
}

/** Extracts the problem detail message from a failed API response */
function errorMessage(res: { error?: unknown; data?: unknown }): string | undefined {
  const body = (res.error ?? res.data) as { type?: string; detail?: string } | undefined;
  if (res.error || body?.type?.includes("problemdetail")) {
    return body?.detail || "Request failed";
  }
  return undefined;
}

>>>>>>> main
export default class ModuleService {
  async getAllModules(): Promise<Module[]> {
    const res = await apiClient.request("get", "/v1/modules");
    const apiModules =
      (res.data as unknown as { modules: any[] }).modules ?? [];
    return apiModules.map(toModule);
  }

  async getModuleById(id: string): Promise<Module> {
    const res = await apiClient.request("get", "/v1/modules/{moduleID}", {
      params: { path: { moduleID: id } },
    });
<<<<<<< HEAD
=======
    const message = errorMessage(res);
    if (message) {
      throw new Error(message);
    }
>>>>>>> main
    return toModule(res.data);
  }

  async createModule(
    data: operations["CreateModule"]["requestBody"]["content"]["application/json"],
  ) {
    const res = await apiClient.request("post", "/v1/modules", { body: data });
    const message = errorMessage(res);
    if (message) {
      throw new Error(message);
    }
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
    const message = errorMessage(res);
    if (message) {
      throw new Error(message);
    }
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

    if (!Array.isArray(apiModules)){
      return [];
    }
    return apiModules.map(toModule);
  }
}
