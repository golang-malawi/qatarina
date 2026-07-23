import { Box, Button, Heading, VStack } from "@chakra-ui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DynamicForm, FieldConfig } from "@/components/form";
import { toaster } from "@/components/ui/toaster";
import { useChangePasswordMutation } from "@/data/queries/AuthQueries";
import { useAuth } from "@/hooks/isLoggedIn";
import { z } from "zod";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/workspace/settings/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const mutation = useChangePasswordMutation();
  const navigate = useNavigate();
  const { user: loggedInUser } = useAuth();
  const [activeSetting, setActiveSetting] = useState<string | null>(null);

  // Schema with translated validation messages
  const changePasswordSchema = z
    .object({
      old_password: z.string().min(1, t("workspace.settings.validation.old_required")),
      new_password: z.string().min(6, t("workspace.settings.validation.new_required")),
      confirm_password: z.string().min(1, t("workspace.settings.validation.confirm_required")),
    })
    .refine((data) => data.new_password === data.confirm_password, {
      message: t("workspace.settings.validation.mismatch"),
      path: ["confirm_password"],
    });

  // Fields with translated labels
  const changePasswordFields: FieldConfig[] = [
    { name: "old_password", label: t("workspace.settings.old_password"), type: "password", required: true },
    { name: "new_password", label: t("workspace.settings.new_password"), type: "password", required: true },
    { name: "confirm_password", label: t("workspace.settings.confirm_password"), type: "password", required: true },
  ];

  const handleSubmit = async (values: any) => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      toaster.create({
        title: t("workspace.settings.error"),
        description: t("workspace.settings.no_user_id"),
        type: "error",
        closable: true,
      });
      return;
    }

    mutation.mutate(
      {
        user_id: parseInt(userId, 10),
        old_password: values.old_password,
        new_password: values.new_password,
        confirm_password: values.confirm_password,
      },
      {
        onSuccess: (data: any) => {
          if (data?.type && data?.detail) {
            toaster.create({
              title: t("workspace.settings.error"),
              description: data.detail,
              type: "error",
              closable: true,
            });
            return;
          }
          toaster.create({
            title: t("workspace.settings.password_changed"),
            description: data?.message ?? t("workspace.settings.password_updated"),
            type: "success",
            closable: true,
          });
          setActiveSetting(null);
        },
        onError: (error: any) => {
          const description =
            error?.data?.detail ||
            error?.data?.title ||
            error?.message ||
            t("workspace.settings.password_failed");
          toaster.create({
            title: t("workspace.settings.error"),
            description,
            type: "error",
            closable: true,
          });
        },
      }
    );
  };

  return (
    <Box p={6}>
      <Heading size="3xl" mb={6}>
        {t("workspace.settings.title")}
      </Heading>

      {!activeSetting && (
        <VStack align="start" gap={4}>
          <Button
            variant="outline"
            onClick={() =>
              loggedInUser?.user_id &&
              navigate({
                to: "/workspace/users/$userID/edit",
                params: { userID: loggedInUser.user_id.toString() },
              })
            }
          >
            {t("workspace.settings.edit_profile")}
          </Button>

          <Button variant="outline" onClick={() => setActiveSetting("change-password")}>
            {t("workspace.settings.change_password")}
          </Button>
        </VStack>
      )}

      {activeSetting === "change-password" && (
        <DynamicForm
          schema={changePasswordSchema}
          fields={changePasswordFields}
          onSubmit={handleSubmit}
          submitText={t("workspace.settings.update_password")}
          layout="vertical"
          spacing={4}
        />
      )}
    </Box>
  );
}
