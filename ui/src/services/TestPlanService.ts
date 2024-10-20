import axios from "axios";
import { getApiEndpoint } from "../common/request";
import useAuthHeaders from "../hooks/useAuthHeaders";

export default class TestPlanService {
  apiEndpoint: string;

  constructor() {
    this.apiEndpoint = getApiEndpoint();
  }

  async findAll() {
    const res = await axios.get(
      `${this.apiEndpoint}/v1/test-plans`,
      useAuthHeaders(),
    );
    if (res.status === 200) {
      return res.data.test_plans;
    }
    throw new Error(res.data);
  }

  async findById(id: string) {
    const res = await axios.get(
      `${this.apiEndpoint}/v1/test-plans/${id}`,
      useAuthHeaders(),
    );
    if (res.status === 200) {
      return res.data.test_plan;
    }
    throw new Error(res.data);
  }

  async create(data: any) {
    const res = await axios.post(
      `${this.apiEndpoint}/v1/test-plans`,
      data,
      useAuthHeaders(),
    );
    if (res.status === 200) {
      return res;
    }
    throw new Error(res.data);
  }

  async deleteTester(id: string) {
    const res = await axios.delete(
      `${this.apiEndpoint}/v1/test-plans/${id}`,
      useAuthHeaders(),
    );
    if (res.status === 200) {
      return res.data.test_plan;
    }
    throw new Error(res.data);
  }
}
