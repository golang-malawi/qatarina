import { useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchTestcase, recordTestResult } from "../services/TestExecution";

export default function PublicTestPage(){
    const {token} = useParams({from: "/invite/$token"});
    const [loading, setLoading] = useState(true);
    const [testcase, setTestcase] = useState<any>(null);
    const [result, setResult] = useState<string | null>(null);
    const[comment, setComment] = useState("");

    useEffect(() => {
        const loadTestcase = async () => {
            try {
                const data = await fetchTestcase(token);
                setTestcase(data);                
            } catch (err) {
                alert("Error loading testcase: " + (err as Error).message);
            }finally {
                setLoading(false);
            }
        };
        loadTestcase();
    }, [token]);

    const handleSubmit = async () => {
        if (!result) {
            alert("Please select a result before submitting.");
            return;
        }
        try {
            await recordTestResult(token, testcase.testcaseId, result, comment);
            alert("Your result has been recorded. Thank you!");
        } catch (err) {
            alert("Error submitting results: " + (err as Error).message);
        }
    };

    if (loading) return <p>Loading testcase...</p>;
    if (!testcase) return <p>No testcase found for this invite.</p>;

    return (
        <div className="max-w-xl mx-auto p-6">
            <h1 className="text-2xl font-bold">{testcase.title}</h1>
            <p className="mt-4 text-gray-700">Steps:</p>
            <ul className="list-disc ml-6 text-gray-600">
                {testcase.steps.map((step: string, idx: number) => (
                    <li key={idx}>{step}</li>
                ))}
            </ul>

            <div className="mt-6 flex gap-4">
                <button
                onClick={() => setResult("Pass")}
                className={`px-4 py-2 rounded ${result === "Pass" ? "bg-green-600 text-white" : "bg-green-200"}`}
                >
                    Pass ✅
                </button>
                <button
                    onClick={() => setResult("Fail")}
                    className={`px-4 py-2 rounded ${result === "Fail" ? "bg-red-600 text-white" : "bg-red-200"}`}
                    >
                        Fail ❌
                </button>
                <button
                onClick={() => setResult("Blocked")}
                className={`px-4 py-2 rounded ${result === "Blocked" ? "bg-gray-600 text-white" : "bg-gray-200"}`}
                >
                    Blocked 🚫
                </button>
            </div>

            <textarea
            className="mt-4 w-full border rounded p-2"
            placeholder="Add comments (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            />

            <button
            onClick={handleSubmit}
            className="mt-6 bg-blue-600 text-white px-6 py-2 rounded"
            >
                Submit Result
            </button>
        </div>
    );
}