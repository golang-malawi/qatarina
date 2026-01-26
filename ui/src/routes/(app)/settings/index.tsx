import { Box, Button, Heading, VStack} from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import { DynamicForm, FieldConfig } from "@/components/form";
import { toaster } from "@/components/ui/toaster";
import { useChangePasswordMutation } from "@/data/queries/AuthQueries";
import { z } from "zod";
import {useState} from "react"

export const Route = createFileRoute("/(app)/settings/")({
  component: RouteComponent,
});

const changePasswordSchema = z.object({
    old_pasword: z.string().min(1, "Old password is required"),
    new_pasword: z.string().min(6, "New password must be atleast 6 characters"),
    confirm_pasword: z.string().min(1, "Confirm password is required"),
}).refine((data) => data.new_pasword === data.confirm_pasword, {
  message: "Password do not match",
  path: ["confirm_password"],
});

const changePasswordFields: FieldConfig[] = [
  {name: "old_password", label: "Old Password", type: "password", required: true},
  {name: "new_password", label: "New Password", type: "password", required: true},
  {name: "confirm_password", label: "Confirm New Password", type: "password", required: true},
]

function RouteComponent() {
  const mutation = useChangePasswordMutation();
  const [activeSetting, setActiveSetting] = useState<string | null>(null);

  const handleSubmit = async (values: any) => {
    const userId = localStorage.getItem("userId");
    mutation.mutate(
      {
        user_id: parseInt(userId || "0"),
        old_password: values.old_password,
        new_password: values.new_password,
        confirm_password: values.confirm_password,
      },
      {
        onSuccess: (data: any) => {
          toaster.create({
            title: "Password changed",
            description: data.message ?? "Password updated successfully",
            type: "success",
            closable: true,
          });
          setActiveSetting(null);
        },
        onError: (error: any) => {
          toaster.create({
            title: "Error",
            description: error?.message ?? "Failed to change password",
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
        Settings
      </Heading>
      {!activeSetting && (
        <VStack align="start" spacing={4}>
          <Button variant="outline" onClick={() => setActiveSetting("change-password")}>
            Change Password
          </Button>
        </VStack>
      )}

      {activeSetting === "change-password" && (
        <DynamicForm
          schema={changePasswordSchema} 
          fields={changePasswordFields}
          onSubmit={handleSubmit} 
          submitText="Update Password"
          layout="vertical"
          spacing={4}
        />
      )} 
    </Box>
  );
}
