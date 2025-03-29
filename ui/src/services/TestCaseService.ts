import axios from "axios";
import { getApiEndpoint } from "@/common/request";
import createAuthHeaders from "@/hooks/useAuthHeaders";
import { TestCase } from "@/common/models";


export async function findTestCaseAll(): Promise<TestCase[]> {
  const res = await axios.get(
    `${getApiEndpoint()}/v1/test-cases`,
    createAuthHeaders()
  );
  if (res.status == 200) {
    return res.data.test_cases || [];
  }
  throw new Error(res.data);
}

export async function findTestCaseById(id: string): Promise<TestCase> {
  const res = await axios.get(
    `${getApiEndpoint()}/v1/test-cases/${id}`,
    createAuthHeaders()
  );
  if (res.status === 200) {
    return res.data.test_case;
  }
  throw new Error(res.data);
}

export async function createTestCase(data: unknown) {
  const res = await axios.post(
    `${getApiEndpoint()}/v1/test-cases`,
    data,
    createAuthHeaders()
  );
  if (res.status === 200) {
    // TODO: return a specific shape of the response, not the whole response
    // return res.data.test_case;
    return res;
  }
  throw new Error(res.data);
}

export async function findTestCasesByProjectId(
  projectID: string
): Promise<TestCase[]> {
  const res = await axios.get(
    `${getApiEndpoint()}/v1/projects/${projectID}/test-cases`,
    createAuthHeaders()
  );
  if (res.status === 200) {
    return res.data.test_cases || [];
  }
  throw new Error(res.data);
}
