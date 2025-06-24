import { components } from "@/lib/api/v1";

export interface Project {
  id: number;
  title?: string;
  description?: string;
  version?: string;
  tags?: string[];
}
export interface TestCase {
  id: string;
  title?: string;
  code?: string;
  description?: string;
  tags?: string[];
  usage_count?: number;
}

export interface TestPlan {
  id: number;
  title?: string;
  code?: string;
  description?: string;
  tags?: string[];
}

export interface SelectAssignedTestCase {
  test_case_id: string;
  user_ids: number[];
}

export interface TesterRecord {
  user_id: number;
  name: string;
  last_login_at: string;
}


export type CreateTestPlan = components["schemas"]["schema.CreateTestPlan"]