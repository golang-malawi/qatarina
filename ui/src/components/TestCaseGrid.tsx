import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Spinner,
  Stack,
  Table,
  Text,
  Badge,
} from "@chakra-ui/react";
import { IconPlayerPlay, IconAlertCircle } from "@tabler/icons-react";
import { useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useTestPlanTestCasesQuery } from "@/services/TestPlanService";
import { useExecuteTestCaseMutation } from "@/services/TestExecutionService";
import { TestExecutionProgress } from "./TestExecutionProgress";
import { toaster } from "./ui/toaster";
import type { components } from "@/lib/api/v1";

interface ExecutingTestCase {
  testCaseID: string;
  testRunID?: string;
  title: string;
}

interface TestCaseGridProps {
  testCases?: Array<{
    id?: string;
    code?: string;
    title?: string;
    description?: string;
    kind?: string;
    tags?: string[];
  }>;
  onExecute?: (testCaseID: string) => void;
  onExecutionComplete?: (state: "passed" | "failed" | "pending") => void;
}

type TestCaseListResponse = components["schemas"]["schema.TestCaseListResponse"];
type TestCase = NonNullable<TestCaseListResponse["test_cases"]>[number];

export default function TestCaseGrid({ testCases, onExecute, onExecutionComplete }: TestCaseGridProps) {
  const { testPlanID } = useParams({
    from: "/(project)/projects/$projectId/test-plans/$testPlanID/execute/",
  });

  const { data, isLoading, error } = useTestPlanTestCasesQuery(Number(testPlanID));
  const executeTestCaseMutation = useExecuteTestCaseMutation();
  const [executingTestCase, setExecutingTestCase] = useState<ExecutingTestCase | null>(null);

  const handleExecuteTestCase = async (testCaseID: string, title: string) => {
    try {
      setExecutingTestCase({ testCaseID, testRunID: "", title });

      const response = await executeTestCaseMutation.mutateAsync({
        testCaseID,
        testPlanID: Number(testPlanID),
      });

      if (response?.id) {
        setExecutingTestCase((prev) =>
          prev ? { ...prev, testRunID: response.id } : null,
        );
      }
    } catch (err) {
      toaster.create({
        title: "Failed to execute test case",
        description: (err as Error).message || "Unknown error occurred",
        type: "error",
        duration: 5000,
      });
      setExecutingTestCase(null);
    }
  };

  const handleExecutionComplete = (state: "passed" | "failed" | "pending") => {
    toaster.create({
      title: `Test Execution ${state}`,
      description: `Test case execution finished with status: ${state}`,
      type: state === "passed" ? "success" : state === "failed" ? "error" : "info",
      duration: 5000,
    });
    onExecutionComplete?.(state);
    setExecutingTestCase(null);
  };

  const testCasesData = data as TestCaseListResponse | undefined;
  const cases: TestCase[] = testCases ?? testCasesData?.test_cases ?? [];

  if (!testCases && isLoading) {
    return (
      <Flex justify="center" align="center" minH="200px">
        <Stack align="center" gap={2}>
          <Spinner size="lg" color="brand.solid" />
          <Text color="fg.muted">Loading test cases...</Text>
        </Stack>
      </Flex>
    );
  }

  if (!testCases && error) {
    return (
      <Box p={4} bg="red.subtle" borderRadius="md">
        <HStack gap={2}>
          <Icon color="red.solid">
            <IconAlertCircle />
          </Icon>
          <Text color="red.solid">Failed to load test cases</Text>
        </HStack>
      </Box>
    );
  }

  if (cases.length === 0) {
    return (
      <Box p={6} textAlign="center">
        <Text color="fg.muted">No test cases found in this test plan</Text>
      </Box>
    );
  }

  return (
    <Stack gap={6}>
      <Box overflowX="auto">
        <Table.Root variant="outline" size="sm">
          <Table.Header bg="bg.subtle">
            <Table.Row>
              <Table.ColumnHeader w="80px">Code</Table.ColumnHeader>
              <Table.ColumnHeader flex={2}>Title</Table.ColumnHeader>
              <Table.ColumnHeader flex={2}>Description</Table.ColumnHeader>
              <Table.ColumnHeader w="120px">Kind</Table.ColumnHeader>
              <Table.ColumnHeader w="200px">Tags</Table.ColumnHeader>
              <Table.ColumnHeader w="100px" textAlign="center">Action</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {cases.map((testCase) => (
              <Table.Row key={testCase.id ?? ""} _hover={{ bg: "bg.muted" }}>
                <Table.Cell>
                  <Text fontSize="sm" fontFamily="monospace">
                    {testCase.code || "—"}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text fontSize="sm" fontWeight="medium">
                    {testCase.title}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text fontSize="sm" color="fg.muted" lineClamp={2}>
                    {testCase.description}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Badge size="sm" variant="subtle">
                    {testCase.kind}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <HStack gap={1}>
                    {testCase.tags?.slice(0, 2).map((tag: string, idx: number) => (
                      <Badge key={idx} size="xs" variant="subtle">
                        {tag}
                      </Badge>
                    ))}
                    {testCase.tags && testCase.tags.length > 2 && (
                      <Badge size="xs" variant="subtle">
                        +{testCase.tags.length - 2}
                      </Badge>
                    )}
                  </HStack>
                </Table.Cell>
                <Table.Cell textAlign="center">
                  <Button
                    size="sm"
                    variant="outline"
                    colorPalette="brand"
                    disabled={
                      executingTestCase?.testCaseID === testCase.id || executeTestCaseMutation.isPending
                    }
                    loading={executingTestCase?.testCaseID === testCase.id}
                    onClick={() => {
                      if (onExecute) {
                        onExecute(testCase.id ?? "");
                      } else {
                        handleExecuteTestCase(testCase.id ?? "", testCase.title ?? "");
                      }
                    }}
                  >
                    {executingTestCase?.testCaseID === testCase.id ? (
                      <HStack gap={2}>
                        <Spinner size="sm" />
                        <Text>Executing</Text>
                      </HStack>
                    ) : (
                      <Icon>
                        <IconPlayerPlay />
                      </Icon>
                    )}
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>

      {executingTestCase?.testRunID && (
        <Box>
          <TestExecutionProgress
            testRunID={executingTestCase.testRunID}
            testCaseTitle={executingTestCase.title}
            onComplete={handleExecutionComplete}
          />
        </Box>
      )}
    </Stack>
  );
}
