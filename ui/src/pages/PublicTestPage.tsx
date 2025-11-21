import { useParams } from "@tanstack/react-router";
import {
    Box,
    Heading,
    Text,
    Button,
    Textarea,
    Stack,
    Spinner,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { fetchTestcase, recordTestResult } from "../services/TestExecution";
import {toaster} from "../components/ui/toaster";

type Status = "Pass" | "Fail" | "Blocked";

export default function PublicTestPage(){
    const {token} = useParams({from: "/invite/$token"});
    const [loading, setLoading] = useState(true);
    const [testcase, setTestcase] = useState<any>(null);
    const [result, setResult] = useState<Status | null>(null);
    const[comment, setComment] = useState("");

    useEffect(() => {
        const loadTestcase = async () => {
            try {
                const data = await fetchTestcase(token);
                setTestcase(data);                
            } catch (err) {
                toaster.create({
                    title: "Error loading testcase",
                    description: (err as Error).message,
                    type: "error",
                    duration: 5000,
            });
            }finally {
                setLoading(false);
            }
        };
        loadTestcase();
    }, [token]);

    const handleSubmit = async () => {
        if (!result) {
            toaster.create({
                title: "Missing result",
                description: "Please select a result before submitting.",
                type: "warning",
                duration: 4000,
            });
            return;
        }
        try {
            await recordTestResult(token, testcase.test_case_id, result, comment);
           toaster.create({
            title: "Result recorded",
            description: "Your result has been recorded. Thank you!",
            type: "success",
            duration: 5000,
           });
        } catch (err) {
            toaster.create({
                title: "Submission error",
                description: (err as Error).message,
                type: "error",
                duration: 5000,
            });
        }
    };

    if (loading) return <Spinner size="xl" mt={10} display="block" mx="auto" />;
    if (!testcase)
     return (
     <Text textAlign="center" mt={10}>
        No testcase found for this invite.
     </Text>
     );

     const colorSchemeMap: Record<Status, string> = {
        Pass: "green",
        Fail: "red",
        Blocked: "gray",
     };

    return (
        <Box maxW="xl" mx="auto" p={6}>
            <Heading size="lg" textAlign="center" mb={6}>
                {testcase.title}
            </Heading>

            <Stack spacing={4}>
                <Text fontWeight="medium">Select result:</Text>
                <Stack direction="row" justify="center" spacing={4}>
                    {(["Pass", "Fail", "Blocked"] as Status[]).map((status) =>(
                    <Button
                    key={status}
                    onClick={() => setResult(status)}
                    variant="ghost"
                    bg={result === status ? `${colorSchemeMap[status]}.500` : "transparent"}
                    color={result === status ? "white" : `${colorSchemeMap[status]}.500`}
                    _hover={{
                        bg: result === status ? `${colorSchemeMap[status]}.600` : "gray.100",
                    }}
                    _active={{
                        bg: result === status ? `${colorSchemeMap[status]}.700` : "gray.200",
                    }}
                    _dark={{
                        bg: result === status ? `${colorSchemeMap[status]}.400` : "transparent",
                        color: result === status ? "black" : `${colorSchemeMap[status]}.300`,
                        _hover: {
                            bg: result === status ? `${colorSchemeMap[status]}.500` : "gray.700",
                        },
                    }}
                    >
                    {status === "Pass" && "Pass ✅"}
                    {status === "Fail" && "Fail ❌"}
                    {status === "Blocked" && "Blocked 🚫"}
                    </Button>
                ))}
                </Stack>                        

            <Box>
                <Text fontWeight="medium" mb={2}>
                    Add comment <Text as="span" color="gray.500">(optional)</Text>
                </Text>
                <Textarea
                placeholder="Describe what happened..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                />
            </Box>

            <Button
            onClick={handleSubmit}
            isDisabled={loading}
            isLoading={loading}
            colorScheme="blue"
            alignSelf="center"
            >
                Submit Result
            </Button>
         </Stack>
        </Box> 
    );
}