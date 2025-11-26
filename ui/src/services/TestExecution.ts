
export async function fetchTestcase(token: string) {
    const response= await fetch(`/api/test-execution/${token}`);
    if(!response.ok){
        throw new Error("Failed to fetch testcase");
    }
    return response.json() as Promise<{test_case_id: string; title: string}>; // expected: { testcaseId, title}
}

export async function recordTestResult(
    token: string,
    testcaseId: string,
    result: string,
    comment?: string
){
    const response = await fetch(`/api/test-execution/${token}`,{
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({ test_case_id: testcaseId, result, comment}),
    }); 

    if (!response.ok) {
        const errBody = await response.json();
        throw new Error(errBody.detail || "Failed to record result");
    }
    return response.json();
}
