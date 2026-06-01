import {
  Box,
  Button,
  Card,
  Flex,
  HStack,
  Icon,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { IconAlertCircle, IconCheck, IconClock, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { connectToTestExecution } from "@/services/TestExecutionService";

interface ExecutionLog {
  timestamp: string;
  type: "info" | "success" | "error" | "warning";
  message: string;
}

interface TestExecutionProgressProps {
  testRunID: string;
  testCaseTitle: string;
  onComplete?: (state: "passed" | "failed" | "pending") => void;
}

export function TestExecutionProgress({
  testRunID,
  testCaseTitle,
  onComplete,
}: TestExecutionProgressProps) {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [isExecuting, setIsExecuting] = useState(true);
  const [finalState, setFinalState] = useState<"passed" | "failed" | "pending" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    try {
      const connection = connectToTestExecution(
        testRunID,
        (message: { type?: string; content?: string; state?: "passed" | "failed" | "pending" }) => {
          const executionLog: ExecutionLog = {
            timestamp: new Date().toLocaleTimeString(),
            type: (message.type as ExecutionLog["type"]) || "info",
            message: message.content || JSON.stringify(message),
          };
          setLogs((prev) => [...prev, executionLog]);

          if (message.state === "passed" || message.state === "failed") {
            setFinalState(message.state);
            setIsExecuting(false);
            onComplete?.(message.state);
          }
        },
        (err: Event) => {
          setError("WebSocket connection error");
          setIsExecuting(false);
          console.error("WebSocket error:", err);
        },
        () => {
          if (isExecuting) {
            setIsExecuting(false);
            setFinalState("pending");
          }
        },
      );

      setWs(connection);

      return () => {
        if (connection && connection.readyState === WebSocket.OPEN) {
          connection.close();
        }
      };
    } catch (err) {
      setError("Failed to connect to execution stream");
      setIsExecuting(false);
    }
  }, [testRunID, onComplete]);

  const getStatusIcon = () => {
    if (isExecuting) return <Icon as={IconClock} color="brand.solid" />;
    if (finalState === "passed") return <Icon as={IconCheck} color="green.solid" />;
    if (finalState === "failed") return <Icon as={IconX} color="red.solid" />;
    return <Icon as={IconAlertCircle} color="orange.solid" />;
  };

  const getStatusColor = () => {
    if (isExecuting) return "brand";
    if (finalState === "passed") return "green";
    if (finalState === "failed") return "red";
    return "orange";
  };

  const getStatusText = () => {
    if (isExecuting) return "Executing...";
    if (finalState === "passed") return "Passed";
    if (finalState === "failed") return "Failed";
    return "Pending";
  };

  return (
    <Card.Root border="sm" borderColor="border.subtle" bg="bg.surface">
      <Card.Body p={{ base: 4, md: 5 }}>
        <Stack gap={4}>
          {/* Header */}
          <Flex justify="space-between" align="center">
            <Stack gap={2} flex={1}>
              <HStack gap={2}>
                {getStatusIcon()}
                <Text fontWeight="medium" fontSize="sm" color="fg.heading">
                  {testCaseTitle}
                </Text>
              </HStack>
              <Text fontSize="xs" color="fg.muted">
                Test Run ID: {testRunID}
              </Text>
            </Stack>

            <Stack align="end" gap={1}>
              <HStack gap={1}>
                {isExecuting && <Spinner size="sm" />}
                <Text fontSize="sm" fontWeight="medium" colorPalette={getStatusColor()}>
                  {getStatusText()}
                </Text>
              </HStack>
              <Text fontSize="xs" color="fg.muted">
                {logs.length} events
              </Text>
            </Stack>
          </Flex>

          {/* Error Message */}
          {error && (
            <Box p={3} bg="red.subtle" borderRadius="md" borderLeft="3px solid">
              <HStack gap={2}>
                <Icon as={IconAlertCircle} color="red.solid" />
                <Text fontSize="sm" color="red.solid">
                  {error}
                </Text>
              </HStack>
            </Box>
          )}

          {/* Execution Logs */}
          <Box
            bg="gray.950"
            color="gray.100"
            p={4}
            borderRadius="md"
            fontFamily="monospace"
            fontSize="xs"
            overflowY="auto"
            maxH="400px"
            minH="100px"
            border="1px solid"
            borderColor="gray.800"
          >
            {logs.length === 0 ? (
              <Text color="gray.500">Waiting for execution to start...</Text>
            ) : (
              <Stack gap={1} fontFamily="monospace" fontSize="xs">
                {logs.map((log, idx) => (
                  <Flex key={idx} gap={2}>
                    <Text color="gray.500" minW="100px" textAlign="right">
                      [{log.timestamp}]
                    </Text>
                    <Text
                      color={
                        log.type === "error"
                          ? "red.300"
                          : log.type === "success"
                          ? "green.300"
                          : log.type === "warning"
                          ? "yellow.300"
                          : "gray.300"
                      }
                    >
                      {log.message}
                    </Text>
                  </Flex>
                ))}
              </Stack>
            )}
          </Box>

          {/* Footer */}
          <HStack justify="end" gap={2}>
            {!isExecuting && (
              <Button size="sm" variant="outline" colorPalette="gray">
                Copy Logs
              </Button>
            )}
            {isExecuting && (
              <Button
                size="sm"
                variant="outline"
                colorPalette="red"
                onClick={() => {
                  if (ws) {
                    ws.close();
                  }
                  setIsExecuting(false);
                }}
              >
                Stop
              </Button>
            )}
          </HStack>
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
