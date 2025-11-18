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
            await recordTestResult(token, testcase.test_case_id, result, comment);
            alert("Your result has been recorded. Thank you!");
        } catch (err) {
            alert("Error submitting results: " + (err as Error).message);
        }
    };

    if (loading) return <p className="text-center mt-10">Loading testcase...</p>;
    if (!testcase) return <p className="text-center mt-10">No testcase found for this invite.</p>;

    return (
        <div className="max-w-xl mx-auto p-6 space-y-6">
            <h1 className="text-2xl font-bold text-center">{testcase.title}</h1>
            
            <div className="space-y-2">
                <p className="text-gray-700 font-medium">Select result:</p>
                <div className="flex justify-center gap-4">
                    {["Pass", "Fail", "Blocked"].map((status) => {
                        const baseStyles = "px-4 py-2 rounded cursor-pointer transition";
                        const selected = result === status;
                        const colorMap: { [key: string]: string} = {
                            Pass: selected ? "bg-green-600 text-white" : "bg-green-200 hover:bg-green-300 active:bg-green-400",
                            Fail: selected ? "bg-red-600 text-white" : "bg-red-200 hover:bg-red-300 active:bg-red-400",
                            Blocked: selected ? "bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300 active:bg-gray-400",
                        };
                        return (
                            <button
                            key={status}
                            onClick={() => setResult(status)}
                            className={`${baseStyles} ${colorMap[status]}`}
                            >
                                {status === "Pass" && "Pass ✅"}
                                {status === "Fail" && "Fail ❌"}
                                {status == "Blocked" && "Blocked 🚫"}
                            </button>
                        );
                    })}
                </div>                
            </div>

                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Add comments <span className="text-gray-500">(optional)</span></label> 
                        <textarea
                        className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                        placeholder="Describe what happened..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        />
                    </div>

                    <div className="text-center">
                        <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className={`px-6 py-2 rounded transition ${
                        loading
                        ? "bg-blue-300 text-white cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
                }`}
                >
                    {loading ? "Submitting..." : "Submit Result"}
                </button>
                </div>        
        </div>
    );
}