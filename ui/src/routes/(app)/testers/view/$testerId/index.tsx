import {
  Box,
  Heading,
  Text,
  Spinner,
  Stack,
} from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useTesterQuery } from "@/services/TesterService";
import ErrorAlert from "@/components/ui/error-alert";

export const Route = createFileRoute("/(app)/testers/view/$testerId/")({
  component: ViewTesterPage,
});

function ViewTesterPage() {
  const {testerId} = Route.useParams();
  const {data, isPending, isError, error} = useTesterQuery(testerId);

  if (isPending){
    return (
      <Box p={6}>
        <Spinner size="lg" />
      </Box>
    );
  }

  if (isError) {
    return (
      <ErrorAlert
      message={`Failed to load tester: ${error?.detail ?? error?.title ?? "Unknown errir"}`}
       />
    );
  }

  const tester = data;

  return (
    <Box p={6}>
      <Heading size="lg" mb={4}>
        Tester Details
      </Heading>
      <Stack gap={4}>
        <Text><strong>User ID:</strong> {tester.user_id}</Text>
        <Text><strong>Name:</strong> {tester.name}</Text>
        <Text><strong>Email:</strong> {tester.email}</Text>
        <Text><strong>Project:</strong> {tester.project}</Text>
        <Text><strong>Role:</strong> {tester.role}</Text>
        <Text><strong>Last Login:</strong> {tester.last_login_at}</Text>
        <Text><strong>Created At:</strong> {tester.created_at}</Text>
        <Text><strong>Updated At:</strong> {tester.updated_at}</Text>
      </Stack>
      <Box borderTop="1px solid" borderColor="gray.200" mt={6} />
    </Box>
  );
}
