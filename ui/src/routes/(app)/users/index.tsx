import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Box,
  Button,
  Flex,
  Heading,
  Stack,
  Text,
  Icon,
} from "@chakra-ui/react";
import { IconUser } from "@tabler/icons-react";
// import { useSuspenseQuery } from "@tanstack/react-query";
// import $api from "@/lib/api/query";

export const Route = createFileRoute("/(app)/users/")({
  // Commented out the API loader for now
  // loader: ({ context: { queryClient } }) =>
  //   queryClient.ensureQueryData($api.queryOptions("get", "/v1/users")),
  component: RouteComponent,
});

function RouteComponent() {
  // Dummy users data
  const users = [
    {
      id: "1",
      username: "alice123",
      displayName: "Alice Johnson",
      createdAt: "2025-07-15",
    },
    {
      id: "2",
      username: "bob456",
      displayName: "Bob Smith",
      createdAt: "2025-07-14",
    },
    {
      id: "3",
      username: "charlie789",
      displayName: "Charlie Brown",
      createdAt: "2025-07-13",
    },
  ];

  // Commented out API call for now
  // const {
  //   data: { users },
  //   isPending,
  //   error,
  // } = useSuspenseQuery($api.queryOptions("get", "/v1/users"));

  // if (isPending) {
  //   return "Loading users...";
  // }

  // if (error) {
  //   return <div className="error">Error: error fetching users</div>;
  // }

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Users</Heading>
        <Link to={`/users/new`}>
          <Button colorScheme="teal">+ Add New User</Button>
        </Link>
      </Flex>

      <Stack spacing={4}>
        {users.map((user) => (
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
                <Link
                  to={`/users/view/$userID`}
                  params={{ userID: user.id }}
                >
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
