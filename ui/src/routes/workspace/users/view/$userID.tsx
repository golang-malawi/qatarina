import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Stack,
  Spinner,
  Image,
} from "@chakra-ui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useGetUserQuery, deleteUserByID  } from "@/services/UserService";
import ErrorAlert from "@/components/ui/error-alert";

export const Route = createFileRoute("/workspace/users/view/$userID")({
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
      await navigate({ to: "/workspace/users" });
    } catch (err) {
      console.log("Failed to deactivate user:", err);
    }
  };

  if (isPending) {
    return (
      <Flex justify="center" align="center" p={6}>
        <Spinner size="lg" color="brand.solid" />
      </Flex>
    );
  }

  if (isError || !user) {
    return (
      <ErrorAlert message={`Failed to fetch user details: ${(error as Error)?.message || "Unknown error"}`} />
    );
  }

  const displayName = user.DisplayName ? user.DisplayName : "N/A";
  const email = user.Email ?? "N/A";
  const role = user.IsSuperAdmin && user.IsSuperAdmin
    ? "Super Admin"
    : "User";
  const joinedAt = user.CreatedAt
    ? new Date(user.CreatedAt).toLocaleDateString()
    : "Unknown";
  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`;

  return (
    <Box p={6}>
      <Heading size="lg" mb={4} color="fg.heading">
        View Profile: {displayName}
      </Heading>

      <Flex
        direction="column"
        align="center"
        p={6}
        border="sm"
        borderColor="border.subtle"
        borderRadius="xl"
        maxW="md"
        mx="auto"
        shadow="card"
        bg="bg.surface"
      >
        <Image
          src={avatarUrl}
          alt={displayName}
          borderRadius="full"
          boxSize="24"
          mb="4"
        />
        <Heading size="md" color="fg.heading">
          {displayName}
        </Heading>
        <Text color="fg.muted">{email}</Text>
        <Text color="fg.subtle" mt={1}>
          Role: {role}
        </Text>
        <Text fontSize="sm" color="fg.subtle" mt={2}>
          Joined on: {joinedAt}
        </Text>

        <Box my={4} w="100%" borderTop="sm" borderColor="border.muted" />

        <Stack direction="row" gap={3}>
          <Button colorPalette="brand" onClick={() => console.log("Edit", user.ID)}>
            Edit Profile
          </Button>
          <Button
            colorPalette="danger"
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
