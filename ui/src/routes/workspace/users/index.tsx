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
  Menu,
  IconButton,
  Input,
  Fieldset,
} from "@chakra-ui/react";
import { IconUser, IconDotsVertical } from "@tabler/icons-react";
import { useUsersQuery, resetUserPassword } from "@/services/UserService";
import ErrorAlert from "@/components/ui/error-alert";
import { Toaster, toaster } from "@/components/ui/toaster";
import { AppDialog } from "@/components/ui/app-dialog";
import { useTranslation } from "react-i18next";
import { useState } from "react";

export const Route = createFileRoute("/workspace/users/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const { data, isPending, isError, error } = useUsersQuery();

  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [userToReset, setUserToReset] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [resetting, setResetting] = useState(false);

  const openResetDialog = (user: any) => {
    setUserToReset(user);
    setNewPassword("");
    setConfirmPassword("");
    setResetDialogOpen(true);
  };

  const closeResetDialog = () => {
    setResetDialogOpen(false);
    setUserToReset(null);
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleResetConfirm = async () => {
    if (!userToReset) return;

    if (newPassword !== confirmPassword) {
      toaster.error({
        title: "Passwords do not match",
        description: "New password and confirmation must be identical.",
      });
      return;
    }

    try {
      setResetting(true);
      await resetUserPassword({
        user_id: Number(userToReset.id),
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      toaster.success({
        title: "Password reset",
        description: `Password for ${userToReset.displayName ?? userToReset.username} was reset successfully.`,
      });
      closeResetDialog();
    } catch (err: any) {
      toaster.error({
        title: "Reset failed",
        description: err?.message || "Failed to reset password",
      });
    } finally {
      setResetting(false);
    }
  };

  if (isPending) {
    return (
      <Flex justify="center" align="center" h="full" p={10}>
        <Spinner size="xl" color="brand.solid" />
      </Flex>
    );
  }

  if (isError) {
    return (
      <ErrorAlert
        message={`${t("users.error.load")}: ${(error as Error).message}`}
      />
    );
  }

  const users = data?.users || [];

  return (
    <Box p={6}>
      <Toaster />
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color="fg.heading">
          {t("users.title")}
        </Heading>
        <Link to={`/workspace/users/new`}>
          <Button colorPalette="brand">+ {t("users.add_button")}</Button>
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
              <Box flex="1">
                <Link
                  to={`/workspace/users/view/$userID`}
                  params={{ userID: user.id }}
                >
                  <Heading size="md" color="fg.heading">
                    {user.displayName}
                  </Heading>
                </Link>
                <Text fontSize="sm" color="fg.muted">
                  {t("users.username")}: {user.username}
                </Text>
                <Text fontSize="xs" color="fg.subtle">
                  {t("users.registered_at")}: {user.createdAt}
                </Text>
              </Box>

              {/* Three-dot actions menu */}
              <Menu.Root>
                <Menu.Trigger asChild>
                  <IconButton
                    variant="ghost"
                    size="sm"
                    aria-label="User actions"
                  >
                    <IconDotsVertical />
                  </IconButton>
                </Menu.Trigger>
                <Menu.Positioner>
                  <Menu.Content
                    bg="bg.surface"
                    border="1px solid"
                    borderColor="border.subtle"
                    shadow="md"
                  >
                    <Menu.Item
                      value="reset-password"
                      onClick={() => openResetDialog(user)}
                    >
                      Reset password
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Menu.Root>
            </Flex>
          </Box>
        ))}
      </Stack>

      {/* Reset Password Dialog */}
      <AppDialog
        open={resetDialogOpen}
        onOpenChange={(event) => {
          if (!event.open) {
            closeResetDialog();
          }
        }}
        title={`Reset password for ${userToReset?.displayName ?? userToReset?.username ?? ""}`}
        footer={
          <>
            <Button variant="outline" onClick={closeResetDialog}>
              Cancel
            </Button>
            <Button
              colorPalette="brand"
              disabled={!newPassword || !confirmPassword}
              loading={resetting}
              onClick={handleResetConfirm}
            >
              Reset Password
            </Button>
          </>
        }
      >
        <Box fontSize="sm" mb={3} color="fg.muted">
          Enter a new password for{" "}
          <Text as="span" fontWeight="medium" color="fg.default">
            {userToReset?.displayName ?? userToReset?.username}
          </Text>
          . The user will need to log in with the new password.
        </Box>
        <Fieldset.Root>
          <Fieldset.Content>
            <Box mb={3}>
              <Text fontSize="xs" fontWeight="medium" mb={1}>
                New password
              </Text>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </Box>
            <Box>
              <Text fontSize="xs" fontWeight="medium" mb={1}>
                Confirm password
              </Text>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <Text fontSize="xs" color="fg.error" mt={1}>
                  Passwords do not match
                </Text>
              )}
            </Box>
          </Fieldset.Content>
        </Fieldset.Root>
      </AppDialog>
    </Box>
  );
}