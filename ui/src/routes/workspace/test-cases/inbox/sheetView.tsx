import { useState } from "react";
import {
  Box,
  Flex,
  Heading,
  Button,
  Table,
  Textarea,
  Text,
  Badge,
} from "@chakra-ui/react";
import { components } from "@/lib/api/v1";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  findTestCaseInboxQueryOptions,
  findTestCaseSummaryQueryOptions,
} from "@/data/queries/test-cases";
import { createTestRun, executeTestRun } from "@/services/TestRunService";
import { toaster } from "@/components/ui/toaster";
import { useAuth } from "@/hooks/isLoggedIn";

interface SheetViewProps {
  testCases: components["schemas"]["schema.AssignedTestCase"][];
  projectMap: Record<number, string>;
  environmentMap: Record<number, string>;
  onBackToStandard: () => void;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
}

export function SheetView({
  testCases,
  projectMap,
  environmentMap,
  onBackToStandard,
  page,
  setPage,
  totalPages,
}: SheetViewProps) {
  const [sheetStatuses, setSheetStatuses] = useState<Record<string, "passed" | "failed">>({});
  const [sheetNotes, setSheetNotes] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();
  const auth = useAuth();
  const currentUser = auth.user;

  const executeSheetMutation = useMutation({
    mutationFn: async ({
      tc,
      status,
    }: {
      tc: components["schemas"]["schema.AssignedTestCase"];
      status: "passed" | "failed";
    }) => {
      const resText = "Executed via Sheet View";
      const noteText = sheetNotes[tc.id!] || "";

      if (!tc.id) throw new Error("Test case ID is missing.");
      if (!currentUser?.user_id) throw new Error("User ID is missing.");
      if (!tc.project_id || !tc.test_plan_id) {
        throw new Error("Project ID or Test Plan ID is missing.");
      }

      const run = await createTestRun({
        test_case_id: tc.id,
        test_plan_id: tc.test_plan_id,
        project_id: tc.project_id,
        owner_id: currentUser.user_id,
        tested_by_id: currentUser.user_id,
        assigned_to_id: currentUser.user_id,
      });

      if (!run?.id) throw new Error("Run ID is missing.");

      return executeTestRun(run.id, {
        test_run_id: run.id,
        result_state: status,
        actual_result: resText,
        notes: noteText,
        expected_result: tc.description,
        environment_id: tc.environment_id,
        tested_on: new Date().toISOString(),
        is_closed: false,
      });
    },
    onSuccess: () => {
      toaster.create({
        title: "Success",
        description: "Test result recorded via Sheet View",
        type: "success",
      });
      queryClient.invalidateQueries(findTestCaseInboxQueryOptions(false));
      queryClient.invalidateQueries(findTestCaseSummaryQueryOptions);
    },
    onError: () => {
      toaster.create({
        title: "Error",
        description: "Failed to record test result",
        type: "error",
      });
    },
  });

  return (
    <Box display="flex" flexDirection="column" h="full">
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg" color="fg.heading">
          Test Case Sheet View
        </Heading>
        <Button
          variant="outline"
          colorPalette="brand"
          onClick={onBackToStandard}
        >
          Back to Standard View
        </Button>
      </Flex>

      {/* Excel-like Grid Container */}
      <Box
        flex="1"
        overflowY="auto"
        border="1px solid"
        borderColor="gray.300"
        bg="white"
        borderRadius="md"
        boxShadow="sm"
      >
        <Table.Root size="sm" variant="outline" css={{ borderCollapse: "collapse", tableLayout: "fixed" }}>
          <Table.Header
            position="sticky"
            top={0}
            zIndex={1}
            bg="gray.100"
          >
            <Table.Row>
              <Table.ColumnHeader width="22%" border="1px solid" borderColor="gray.300" fontWeight="bold" color="gray.700">
                Title & Details
              </Table.ColumnHeader>
              <Table.ColumnHeader width="14%" border="1px solid" borderColor="gray.300" fontWeight="bold" color="gray.700">
                Project
              </Table.ColumnHeader>
              <Table.ColumnHeader width="14%" border="1px solid" borderColor="gray.300" fontWeight="bold" color="gray.700">
                Environment
              </Table.ColumnHeader>
              <Table.ColumnHeader width="15%" border="1px solid" borderColor="gray.300" fontWeight="bold" color="gray.700">
                Result Status
              </Table.ColumnHeader>
              <Table.ColumnHeader width="25%" border="1px solid" borderColor="gray.300" fontWeight="bold" color="gray.700">
                Comments / Notes
              </Table.ColumnHeader>
              <Table.ColumnHeader width="10%" border="1px solid" borderColor="gray.300" fontWeight="bold" color="gray.700" textAlign="center">
                Action
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {testCases.length > 0 ? (
              testCases.map((tc, index) => {
                const rowBg = index % 2 === 0 ? "white" : "gray.50";
                return (
                  <Table.Row key={tc.id} bg={rowBg} _hover={{ bg: "blue.50" }}>
                    <Table.Cell border="1px solid" borderColor="gray.200" py={3} verticalAlign="top">
                      <Text fontWeight="semibold" fontSize="sm">{tc.title}</Text>
                      <Text
                        fontSize="xs"
                        color="gray.600"
                        whiteSpace="normal"
                        wordBreak="break-word"
                        mt={1}
                      >
                        {tc.description}
                      </Text>
                    </Table.Cell>
                    <Table.Cell border="1px solid" borderColor="gray.200" fontSize="sm" verticalAlign="top">
                      {projectMap[tc.project_id ?? -1] ?? "Unknown"}
                    </Table.Cell>
                    <Table.Cell border="1px solid" borderColor="gray.200" verticalAlign="top">
                      <Badge variant="subtle" colorPalette="info">
                        {tc.environment_id && environmentMap[tc.environment_id]
                          ? environmentMap[tc.environment_id]
                          : "Not specified"}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell border="1px solid" borderColor="gray.200" verticalAlign="top">
                      <select
                        style={{
                          width: "100%",
                          padding: "6px",
                          borderRadius: "2px",
                          border: "1px solid #cbd5e1",
                          background: "#ffffff",
                          fontSize: "13px",
                        }}
                        value={sheetStatuses[tc.id!] || ""}
                        onChange={(e) =>
                          setSheetStatuses({
                            ...sheetStatuses,
                            [tc.id!]: e.target.value as "passed" | "failed",
                          })
                        }
                      >
                        <option value="">Select status...</option>
                        <option value="passed">Passed</option>
                        <option value="failed">Failed</option>
                      </select>
                    </Table.Cell>
                    <Table.Cell border="1px solid" borderColor="gray.200" verticalAlign="top">
                      <Textarea
                        size="xs"
                        placeholder="Add comments..."
                        value={sheetNotes[tc.id!] || ""}
                        borderRadius="2px"
                        borderColor="gray.300"
                        bg="white"
                        rows={2}
                        onChange={(e) =>
                          setSheetNotes({
                            ...sheetNotes,
                            [tc.id!]: e.target.value,
                          })
                        }
                      />
                    </Table.Cell>
                    <Table.Cell border="1px solid" borderColor="gray.200" textAlign="center" verticalAlign="top">
                      <Button
                        size="xs"
                        colorPalette="brand"
                        disabled={!sheetStatuses[tc.id!]}
                        loading={executeSheetMutation.isPending}
                        onClick={() => {
                          const chosenStatus = sheetStatuses[tc.id!];
                          if (chosenStatus) {
                            executeSheetMutation.mutate({ tc, status: chosenStatus });
                          }
                        }}
                      >
                        Record
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                );
              })
            ) : (
              <Table.Row>
                <Table.Cell colSpan={6} textAlign="center" color="gray.500" py={6} border="1px solid" borderColor="gray.200">
                  No test cases found.
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Box>

      {/* Pagination Controls */}
      <Box p={4} borderTop="1px solid" borderColor="gray.200" mt={2}>
        <Flex justify="space-between" align="center">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Text fontSize="sm" fontWeight="medium">
            Page {page} of {totalPages}
          </Text>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}