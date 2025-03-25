import axios from "axios";
import { getApiEndpoint } from "@/common/request";
import createAuthHeaders from "@/hooks/useAuthHeaders";
import { TestPlan } from "@/common/models";

export default class TestPlanService {
  apiEndpoint: string;

  constructor() {
    this.apiEndpoint = getApiEndpoint();
  }

  async findAllByProject(projectId: string) {
    const res = await axios.get(
      `${this.apiEndpoint}/v1/projects/${projectId}/test-plans`,
      createAuthHeaders()
    );
    if (res.status === 200) {
      return res.data.test_plans;
    }
    throw new Error(res.data);
  }

  async findById(id: string) {
    const res = await axios.get(
      `${this.apiEndpoint}/v1/test-plans/${id}`,
      createAuthHeaders()
    );
    if (res.status === 200) {
      return res.data.test_plan;
    }
    throw new Error(res.data);
  }

  async create(data: unknown) {
    const res = await axios.post(
      `${this.apiEndpoint}/v1/test-plans`,
      data,
      createAuthHeaders()
    );
    if (res.status === 200) {
      return res;
    }
    throw new Error(res.data);
  }

  async deleteTester(id: string) {
    const res = await axios.delete(
      `${this.apiEndpoint}/v1/test-plans/${id}`,
      createAuthHeaders()
    );
    if (res.status === 200) {
      return res.data.test_plan;
    }
    throw new Error(res.data);
  }
}

export async function findAllTestPlans(): Promise<TestPlan[]> {
  const res = await axios.get(
    `${getApiEndpoint()}/v1/test-plans`,
    createAuthHeaders()
  );
  if (res.status === 200) {
    return res.data.test_plans;
  }
  throw new Error(res.data);
}
