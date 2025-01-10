import axios from "axios";
import { getApiEndpoint } from "../common/request";
import useAuthHeaders from "../hooks/useAuthHeaders";

export default class ProjectService {
  apiEndpoint: string;

  constructor() {
    this.apiEndpoint = getApiEndpoint();
  }

  async findAll() {
    const res = await axios.get(
      `${this.apiEndpoint}/v1/projects`,
      useAuthHeaders(),
    );
    if (res.status === 200) {
      return res.data.projects;
    }
    throw new Error(res.data);
  }

  async findById(projectId: string) {
    const res = await axios.get(
      `${this.apiEndpoint}/v1/projects/${projectId}`,
      useAuthHeaders(),
    );
    if (res.status === 200) {
      return res.data.project;
    }
    throw new Error(res.data);
  }

  async create(data: any) {
    const res = await axios.post(
      `${this.apiEndpoint}/v1/projects`,
      data,
      useAuthHeaders(),
    );
    if (res.status === 200) {
      return res;
    }
    throw new Error(res.data);
  }
}
