
export async function fetchTestcase(token: string) {
    const response= await fetch(`/api/test-execution/${token}`);
    if(!response.ok){
        throw new Error("Failed to fetch testcase");
    }
    return response.json(); // expected: { testcaseId, title, steps}
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
        body: JSON.stringify({ testcaseId, result, comment}),
    }); 

    if (!response.ok) {
        throw new Error("Failed to record result");
    }
    return response.json();
}
