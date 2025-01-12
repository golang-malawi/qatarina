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
