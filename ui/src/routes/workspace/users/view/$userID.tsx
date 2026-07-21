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
import { useGetUserQuery, deleteUserByID } from "@/services/UserService";
import { useAuth } from "@/hooks/isLoggedIn";
import ErrorAlert from "@/components/ui/error-alert";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/workspace/users/view/$userID")({
  component: ViewUserProfile,
});

function ViewUserProfile() {
  const { t } = useTranslation();
  const { userID } = Route.useParams();
  const navigate = useNavigate();
  const { user: loggedInUser } = useAuth();

  const { data: user, isPending, isError, error } = useGetUserQuery(userID);
  const { data: loggedInUserProfile } = useGetUserQuery(
    loggedInUser?.user_id?.toString() || ""
  );

  const isOwnProfile = loggedInUser?.user_id === Number(userID);
  const canEditUser = isOwnProfile || loggedInUserProfile?.is_super_admin === true;
  const canDeactivate = isOwnProfile || loggedInUserProfile?.is_super_admin === true;

  const handleDeactivate = async () => {
    const confirm = window.confirm(t("users.view.deactivate_confirm"));
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
      <ErrorAlert
        message={`${t("users.view.error")}: ${
          (error as Error)?.message || t("common.unknown_error")
        }`}
      />
    );
  }

  const displayName = user.display_name ?? t("common.not_available");
  const email = user.email ?? t("common.not_available");
  const role = user.is_super_admin ? t("users.view.super_admin") : t("users.view.user");
  const joinedAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString()
    : t("common.unknown");

  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    displayName
  )}`;

  return (
    <Box p={6}>
      <Heading size="lg" mb={4} color="fg.heading">
        {t("users.view.title")}: {displayName}
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
          {t("users.view.role")}: {role}
        </Text>
        <Text fontSize="sm" color="fg.subtle" mt={2}>
          {t("users.view.joined_on")}: {joinedAt}
        </Text>

        <Box my={4} w="100%" borderTop="sm" borderColor="border.muted" />

        <Stack direction="row" gap={3}>
          {canEditUser && (
            <Button
              colorPalette="brand"
              onClick={() =>
                navigate({ to: "/workspace/users/$userID/edit", params: { userID } })
              }
            >
              {t("users.view.edit_button")}
            </Button>
          )}
          {canDeactivate && (
            <Button
              colorPalette="danger"
              variant="outline"
              onClick={handleDeactivate}
            >
              {t("users.view.deactivate_button")}
            </Button>
          )}
        </Stack>
      </Flex>
    </Box>
  );
}
