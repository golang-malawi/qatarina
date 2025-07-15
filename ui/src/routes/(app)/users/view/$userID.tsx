import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Stack,
} from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/(app)/users/view/$userID")({
  component: ViewUserProfile,
});

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
  avatarUrl: string;
};

function ViewUserProfile() {
  const { userID } = Route.useParams();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setUser({
        id: userID,
        name: "Alice Johnson",
        email: "alice@example.com",
        role: "Administrator",
        joinedAt: "2025-06-12",
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=Alice`,
      });
    }, 500);

    return () => clearTimeout(timeout);
  }, [userID]);

  if (!user) {
    return <Text>Loading profile...</Text>;
  }

  return (
    <Box p={6}>
      <Heading size="lg" mb={4}>
        View Profile: {user.name}
      </Heading>

      {/* Profile Card */}
      <Flex
        direction="column"
        align="center"
        p={6}
        border="1px solid #ddd"
        borderRadius="md"
        maxW="400px"
        mx="auto"
        boxShadow="md"
        bg="gray.50"
      >
        <img
          src={user.avatarUrl}
          alt={user.name}
          style={{
            borderRadius: "50%",
            width: "100px",
            height: "100px",
            marginBottom: "1rem",
          }}
        />
        <Heading size="md">{user.name}</Heading>
        <Text color="gray.600">{user.email}</Text>
        <Text color="gray.500" mt={1}>
          Role: {user.role}
        </Text>
        <Text fontSize="sm" color="gray.400" mt={2}>
          Joined on: {user.joinedAt}
        </Text>

        <Box my={4} w="100%" h="1px" bg="gray.300" />

        {/* Action Buttons */}
        <Stack direction="row" gap={3}>
          <Button colorScheme="blue" onClick={() => console.log("Edit", user.id)}>
            Edit Profile
          </Button>
          <Button
            colorScheme="red"
            variant="outline"
            onClick={() => console.log("Deactivate", user.id)}
          >
            Deactivate User
          </Button>
        </Stack>
      </Flex>
    </Box>
  );
}
