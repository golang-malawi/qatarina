import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Stack,
  Spinner,
} from "@chakra-ui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useGetUserQuery, deleteUserByID  } from "@/services/UserService";
import ErrorAlert from "@/components/ui/error-alert";

export const Route = createFileRoute("/(app)/users/view/$userID")({
  component: ViewUserProfile,
});

function ViewUserProfile() {
  const { userID } = Route.useParams();
  const navigate = useNavigate();

  const { data: user, isPending, isError, error } = useGetUserQuery(userID);

  const handleDeactivate = async () => {
    const confirm = window.confirm("Are you sure you want to deactivate this user?");
    if (!confirm) return;

    try {
      await deleteUserByID(userID);
      await navigate({ to: "/users" });
    } catch (err) {
      console.log("Failed to deactivate user:", err);
    }
  };

  if (isPending) {
    return (
      <Flex justify="center" align="center" p={6}>
        <Spinner size="lg" color="teal.500" />
      </Flex>
    );
  }

  if (isError || !user) {
    return (
      <ErrorAlert message={`Failed to fetch user details: ${(error as Error)?.message || "Unknown error"}`} />
    );
  }

  const displayName = user.display_name ?? "N/A";
  const email = user.email ?? "N/A";
  const role = user.is_super_admin ? "Super Admin" : "User";  
  const joinedAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString()
    : "Unknown";
  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`;

  return (
    <Box p={6}>
      <Heading size="lg" mb={4}>
        View Profile: {displayName}
      </Heading>

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
          src={avatarUrl}
          alt={displayName}
          style={{
            borderRadius: "50%",
            width: "100px",
            height: "100px",
            marginBottom: "1rem",
          }}
        />
        <Heading size="md">{displayName}</Heading>
        <Text color="gray.600">{email}</Text>
        <Text color="gray.500" mt={1}>
          Role: {role}
        </Text>
        <Text fontSize="sm" color="gray.400" mt={2}>
          Joined on: {joinedAt}
        </Text>

        <Box my={4} w="100%" h="1px" bg="gray.300" />

        <Stack direction="row" gap={3}>
          <Button colorScheme="blue" onClick={() => console.log("Edit", user.id)}>
            Edit Profile
          </Button>
          <Button
            colorScheme="red"
            variant="outline"
            onClick={handleDeactivate}
          >
            Deactivate User
          </Button>
        </Stack>
      </Flex>
    </Box>
  );
}