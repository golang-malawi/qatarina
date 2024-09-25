import axios from "axios";
import useAuthHeaders from "../hooks/useAuthHeaders";

export default class ProjectService {
  apiEndpoint: string;

  constructor(apiEndpoint: string) {
    this.apiEndpoint = apiEndpoint || "";
  }

  async findAll() {
    const res = await axios.get(`${this.apiEndpoint}/v1/projects`, useAuthHeaders())
    if (res.status === 200) {
      return res.data.projects;
    }
    throw new Error(res.data);
  }

  async create(data: any) {
    const res = await axios.post(`${this.apiEndpoint}/v1/projects`, data, useAuthHeaders())
    if (res.status === 200) {
      return res;
    }
    throw new Error(res.data);
  }
}
