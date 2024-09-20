import axios from "axios";
import useAuthHeaders from "../hooks/useAuthHeaders";

export default class ProjectService {
  apiEndpoint: string;

  constructor(apiEndpoint: string) {
    this.apiEndpoint = apiEndpoint;
  }

  async findAll() {
    const res = await axios.get(`${this.apiEndpoint}/v1/projects`, useAuthHeaders())
    return res.data
  }
}
