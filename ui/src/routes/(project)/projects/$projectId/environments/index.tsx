import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Box,
  Button,
  Heading,
  Spinner,
  Text,
  Flex,
  IconButton,
  Menu,
  Portal,
} from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import {
  IconDotsVertical,
  IconEye,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";
import {
  getProjectEnvironments,
  useDeleteEnvironmentMutation,
  useUpdateEnvironmentMutation,
} from "@/services/EnvironmentService";
import { List } from "@chakra-ui/react/list";
import { useTranslation } from "react-i18next";
import { AppDialog } from "@/components/ui/app-dialog";
import { DynamicForm, FieldConfig } from "@/components/form";
import { toaster } from "@/components/ui/toaster";
import { components } from "@/lib/api/v1";

type Environment = components["schemas"]["schema.EnvironmentResponse"];

export const Route = createFileRoute(
  "/(project)/projects/$projectId/environments/"
)({
  component: EnvironmentsPage,
});

function EnvironmentsPage() {
  const { t } = useTranslation();
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const updateMutation = useUpdateEnvironmentMutation();
  const deleteMutation = useDeleteEnvironmentMutation();

  const [envToEdit, setEnvToEdit] = useState<Environment | null>(null);
  const [envToDelete, setEnvToDelete] = useState<Environment | null>(null);

  const { data, isLoading, error } = useQuery<
    Awaited<ReturnType<typeof getProjectEnvironments>>
  >({
    queryKey: ["environments", projectId],
    queryFn: () => getProjectEnvironments(projectId),
  });

  const environments = data?.data?.environments ?? [];

  const editSchema = z.object({
    name: z.string().trim().min(1, t("environments.new.validation.name_required")),
    description: z.string().optional(),
    base_url: z
      .string()
      .url(t("environments.new.validation.url"))
      .optional()
      .or(z.literal("")),
  });

  const editFields: FieldConfig[] = [
    {
      name: "name",
      label: t("environments.new.field.name"),
      type: "text",
      placeholder: t("environments.new.placeholder.name"),
      required: true,
    },
    {
      name: "description",
      label: t("environments.new.field.description"),
      type: "textarea",
      placeholder: t("environments.new.placeholder.description"),
    },
    {
      name: "base_url",
      label: t("environments.new.field.base_url"),
      type: "url",
      placeholder: t("environments.new.placeholder.base_url"),
    },
  ];

  const refreshEnvironments = (environmentId?: number) => {
    queryClient.invalidateQueries({ queryKey: ["environments", projectId] });
    // Test plan pages read environments through the typed $api client
    queryClient.invalidateQueries({
      queryKey: ["get", "/v1/projects/{projectID}/environments"],
    });
    if (environmentId !== undefined) {
      queryClient.invalidateQueries({
        queryKey: ["environment", String(environmentId)],
      });
    }
  };

  const handleUpdate = async (values: z.infer<typeof editSchema>) => {
    if (!envToEdit) return;
    try {
      await updateMutation.mutateAsync({
        params: {
          path: {
            projectID: projectId,
            environmentID: String(envToEdit.id),
          },
        },
        body: {
          name: values.name,
          description: values.description ?? "",
          base_url: values.base_url ?? "",
        },
      });
      toaster.create({
        title: t("environments.edit.success"),
        type: "success",
        duration: 3000,
      });
      refreshEnvironments(envToEdit.id);
      setEnvToEdit(null);
    } catch {
      toaster.create({
        title: t("environments.edit.error"),
        description: t("environments.edit.error_description"),
        type: "error",
        duration: 3000,
      });
    }
  };

  const handleDelete = async () => {
    if (!envToDelete) return;
    try {
      await deleteMutation.mutateAsync({
        params: {
          path: {
            projectID: projectId,
            environmentID: String(envToDelete.id),
          },
        },
      });
      toaster.create({
        title: t("environments.delete.success"),
        type: "success",
        duration: 3000,
      });
      refreshEnvironments(envToDelete.id);
      setEnvToDelete(null);
    } catch {
      toaster.create({
        title: t("environments.delete.error"),
        type: "error",
        duration: 3000,
      });
    }
  };

  if (isLoading) return <Spinner />;
  if (error) return <Text color="red.500">{t("environments.index.error")}</Text>;

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">{t("environments.index.title")}</Heading>
        <Link
          to="/projects/$projectId/environments/new"
          params={{ projectId }}
          search={{ from: "_self" }}
        >
          <Button colorScheme="blue" size="sm">
            + {t("environments.index.add_button")}
          </Button>
        </Link>
      </Flex>

      <List.Root gap={3}>
        {environments.length === 0 ? (
          <Text color="gray.500">{t("environments.index.empty")}</Text>
        ) : (
          environments.map((env) => (
            <List.Item
              key={env.id}
              border="1px solid #ccc"
              p={3}
              borderRadius="md"
            >
              <Flex justify="space-between" align="center" gap={3} w="full">
                <Box minW={0}>
                  <Text fontWeight="bold">{env.name}</Text>
                  {env.description && <Text>{env.description}</Text>}
                  {env.base_url && <Text color="blue.500">{env.base_url}</Text>}
                </Box>

                <Menu.Root>
                  <Menu.Trigger asChild>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      aria-label={t("environments.index.actions")}
                    >
                      <IconDotsVertical />
                    </IconButton>
                  </Menu.Trigger>
                  <Portal>
                    <Menu.Positioner>
                      <Menu.Content
                        bg="bg.surface"
                        border="1px solid"
                        borderColor="border.subtle"
                        shadow="md"
                      >
                        <Menu.Item
                          value="view"
                          onClick={() =>
                            navigate({
                              to: "/projects/$projectId/environments/$environmentId",
                              params: {
                                projectId,
                                environmentId: String(env.id),
                              },
                            })
                          }
                        >
                          <IconEye size={16} />
                          {t("environments.index.view")}
                        </Menu.Item>
                        <Menu.Item value="edit" onClick={() => setEnvToEdit(env)}>
                          <IconPencil size={16} />
                          {t("environments.index.edit")}
                        </Menu.Item>
                        <Menu.Item
                          value="delete"
                          color="fg.error"
                          _hover={{ bg: "bg.error", color: "fg.error" }}
                          onClick={() => setEnvToDelete(env)}
                        >
                          <IconTrash size={16} />
                          {t("environments.index.delete")}
                        </Menu.Item>
                      </Menu.Content>
                    </Menu.Positioner>
                  </Portal>
                </Menu.Root>
              </Flex>
            </List.Item>
          ))
        )}
      </List.Root>

      <AppDialog
        open={envToEdit !== null}
        onOpenChange={(details) => {
          if (!details.open && !updateMutation.isPending) setEnvToEdit(null);
        }}
        title={t("environments.edit.title")}
        showCloseTrigger
        closeButtonLabel={t("environments.dialog.cancel")}
      >
        {envToEdit ? (
          <DynamicForm
            key={envToEdit.id}
            schema={editSchema}
            fields={editFields}
            defaultValues={{
              name: envToEdit.name ?? "",
              description: envToEdit.description ?? "",
              base_url: envToEdit.base_url ?? "",
            }}
            onSubmit={handleUpdate}
            submitText={t("environments.edit.submit")}
            submitLoading={updateMutation.isPending}
            layout="vertical"
            spacing={4}
          />
        ) : null}
      </AppDialog>

      <AppDialog
        open={envToDelete !== null}
        onOpenChange={(details) => {
          if (!details.open && !deleteMutation.isPending) setEnvToDelete(null);
        }}
        title={t("environments.delete.title")}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setEnvToDelete(null)}
              disabled={deleteMutation.isPending}
            >
              {t("environments.dialog.cancel")}
            </Button>
            <Button
              colorPalette="red"
              onClick={handleDelete}
              loading={deleteMutation.isPending}
            >
              {t("environments.delete.confirm")}
            </Button>
          </>
        }
      >
        <Text color="fg.subtle">
          {t("environments.delete.description", { name: envToDelete?.name ?? "" })}
        </Text>
      </AppDialog>
    </Box>
  );
}
