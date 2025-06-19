import axios from "axios";
import { getApiEndpoint } from "@/common/request";
import createAuthHeaders from "@/hooks/useAuthHeaders";


export interface Module {
  id: string;
  Name: string;
  Code: string;
  Type: string;
  Priority: number;
  created_at: string;
  updated_at: string;
  Description: string;
  project_id: number;
}

export default class ModuleService {
  apiEndpoint: string;

  constructor() {
    this.apiEndpoint = getApiEndpoint();
  }

  async getAllModules(): Promise<Module[]> {
    const res = await axios.get(
      `${this.apiEndpoint}/v1/modules/modules`,
      createAuthHeaders()
    );
  
    if (res.status === 200) {
      const apiModules = res.data.modules;
      const modules: Module[] = apiModules.map((mod: any) => ({
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
      
      return modules;
    }
  
    throw new Error(res.data);
  }
  

  async getModuleById(id: string): Promise<Module> {
    console.log("API request to:", `${this.apiEndpoint}/modules/${id}`);
    const res = await axios.get(
      `${this.apiEndpoint}/v1/modules/modules/${id}`,
      createAuthHeaders()
    );
    if (res.status === 200) {
      return res.data; 
      
    }
    console.log(res.data)
    throw new Error(res.data);
  }
  

  async createModule(data: Partial<Module>) {
    const res = await axios.post(
    `${this.apiEndpoint}/v1/modules/modules`,
      data,
      createAuthHeaders()
    );
    if (res.status === 200) {
      return res.data;
    }
    throw new Error(res.data);
  }

  async updateModule(id: string, data: Partial<Module>) {
    const res = await axios.post(
      `${this.apiEndpoint}/v1/modules/modules/${id}`,
      data,
      createAuthHeaders()
    );
    if (res.status === 200) {
      return res.data;
    }
    throw new Error(res.data);
  }

  async deleteModule(id: string) {
    const res = await axios.delete(
      `${this.apiEndpoint}/v1/modules/modules/${id}`,
      createAuthHeaders()
    );
    if (res.status === 200) {
      return res.data;
    }
    throw new Error(res.data);
  }
}
