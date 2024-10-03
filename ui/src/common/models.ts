
export interface TestCase {
    ID: number;
    Title?: string;
    Code?: string;
    Description?: string;
    Tags?: string[];
}

export interface SelectAssignedTestCase {
    test_case_id: number;
    user_ids: number[]
}

export interface TesterRecord {
    user_id: number;
    name: string;
    last_login_at: string;
}
