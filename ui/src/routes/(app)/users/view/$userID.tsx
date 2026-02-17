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
import { useAuth } from "@/hooks/isLoggedIn";
import ErrorAlert from "@/components/ui/error-alert";

export const Route = createFileRoute("/(app)/users/view/$userID")({
  component: ViewUserProfile,
});

function ViewUserProfile() {
  const { userID } = Route.useParams();
  const navigate = useNavigate();
  const { user: loggedInUser } = useAuth();

  const { data: user, isPending, isError, error } = useGetUserQuery(userID);
  const { data: loggedInUserProfile } = useGetUserQuery(loggedInUser?.user_id?.toString() || "");

  // Check if the logged-in user is the same as the user being viewed
  const isOwnProfile = loggedInUser?.user_id === Number(userID);
  
  // Can deactivate only if it's own profile OR user is super admin
  const canDeactivate = isOwnProfile || (loggedInUserProfile?.is_super_admin === true);

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
          {isOwnProfile && (
            <Button 
              colorScheme="blue" 
              onClick={() => navigate({to: "/users/$userID/edit", params: { userID }})}
            >
              Edit Profile
            </Button>
          )}
          {canDeactivate && (
            <Button
              colorScheme="red"
              variant="outline"
              onClick={handleDeactivate}
            >
              Deactivate User
            </Button>
          )}
        </Stack>
      </Flex>
    </Box>
  );
}