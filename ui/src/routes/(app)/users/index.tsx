import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Box,
  Button,
  Flex,
  Heading,
  Stack,
  Text,
  Icon,
  Spinner,
  Alert,
} from "@chakra-ui/react";
import { IconUser } from "@tabler/icons-react";
import { useUsersQuery } from "@/services/UserService";

export const Route = createFileRoute("/(app)/users/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data, isPending, isError, error } = useUsersQuery();

  if (isPending) {
    return (
      <Flex justify="center" align="center" h="full" p={10}>
        <Spinner size="xl" color="teal.500" />
      </Flex>
    );
  }

  if (isError) {
    return (
      <Alert status="error">
        Failed to load users: {(error as Error).message}
      </Alert>
    );
  }

  const users = data?.users || [];

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Users</Heading>
        <Link to={`/users/new`}>
          <Button colorScheme="teal">+ Add New User</Button>
        </Link>
      </Flex>

      <Stack gap={4}>
        {users.map((user: any) => (
          <Box
            key={user.id}
            p={4}
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
            _hover={{ bg: "gray.50", shadow: "sm" }}
            transition="all 0.2s"
          >
            <Flex align="center" gap={3}>
              <Icon as={IconUser} boxSize={6} color="teal.500" />
              <Box>
                <Link to={`/users/view/$userID`} params={{ userID: user.id }}>
                  <Heading size="md">{user.displayName}</Heading>
                </Link>
                <Text fontSize="sm" color="gray.600">
                  Username: {user.username}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Registered At: {user.createdAt}
                </Text>
              </Box>
            </Flex>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}