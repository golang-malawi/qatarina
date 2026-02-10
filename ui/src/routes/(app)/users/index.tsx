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
} from "@chakra-ui/react";
import { IconUser } from "@tabler/icons-react";
import { useUsersQuery } from "@/services/UserService";
import ErrorAlert from "@/components/ui/error-alert";

export const Route = createFileRoute("/(app)/users/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data, isPending, isError } = useUsersQuery();

  if (isPending) {
    return (
      <Flex justify="center" align="center" h="full" p={10}>
        <Spinner size="xl" color="brand.solid" />
      </Flex>
    );
  }

  if (isError) {
    return (
      <ErrorAlert message={`Failed to load users: {(error as Error).message}`} />
    );
  }

  const users = data?.users || [];

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color="fg.heading">
          Users
        </Heading>
        <Link to={`/users/new`}>
          <Button colorPalette="brand">+ Add New User</Button>
        </Link>
      </Flex>

      <Stack gap={4}>
        {users.map((user: any) => (
          <Box
            key={user.id}
            p={4}
            border="sm"
            borderColor="border.subtle"
            borderRadius="lg"
            bg="bg.surface"
            _hover={{ bg: "bg.subtle", shadow: "sm" }}
            transition="all 0.2s"
          >
            <Flex align="center" gap={3}>
              <Icon as={IconUser} boxSize={6} color="fg.accent" />
              <Box>
                <Link to={`/users/view/$userID`} params={{ userID: user.id }}>
                  <Heading size="md" color="fg.heading">
                    {user.displayName}
                  </Heading>
                </Link>
                <Text fontSize="sm" color="fg.muted">
                  Username: {user.username}
                </Text>
                <Text fontSize="xs" color="fg.subtle">
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
