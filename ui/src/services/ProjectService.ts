import axios from "axios";
import { getApiEndpoint } from "@/common/request";
import createAuthHeaders from "@/hooks/useAuthHeaders";

export default class ProjectService {
  apiEndpoint: string;

  constructor() {
    this.apiEndpoint = getApiEndpoint();
  }

  async findById(projectId: string) {
    const res = await axios.get(
      `${this.apiEndpoint}/v1/projects/${projectId}`,
      createAuthHeaders()
    );
    if (res.status === 200) {
      return res.data.project;
    }
    throw new Error(res.data);
  }

  async create(data: unknown) {
    const res = await axios.post(
      `${this.apiEndpoint}/v1/projects`,
      data,
      createAuthHeaders()
    );
    if (res.status === 200) {
      return res;
    }
    throw new Error(res.data);
  }
}

