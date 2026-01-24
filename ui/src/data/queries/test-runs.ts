import { queryOptions} from "@tanstack/react-query";

export interface TestRun {
    id: string;
    test_case_id: string;
    result_state: string;
    assigned_to_id?: number;
    notes?: string;
    actual_results?: string;
    expected_results?: string;
}
export function findTestRunsByProjectQueryOptions(projectId?: number) {
    return queryOptions({
        queryKey: ["test-runs", projectId ?? "none"],
        queryFn: async (): Promise<TestRun[]> => {
            if (!projectId) return [];
            const res = await fetch(`/v1/projects/${projectId}/test-runs`);
            if (!res.ok) throw new Error("Failed  to fetch test runs");
            const data = await res.json();
            return data.test_runs;
        },
    });
}