import {
  Box,
  Stack,
  Table,
  Heading,
  Button,
  Flex,
  Spinner,
  Text,
  IconButton,
  Menu,
  Portal,
} from "@chakra-ui/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import ModuleService, {
  Module,
  buildModuleTree,
  flattenModuleTree,
} from "@/services/ModuleService";
import { LuCornerDownRight } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { AppDialog } from "@/components/ui/app-dialog";
import { DynamicForm } from "@/components/form/DynamicForm";
import { toaster } from "@/components/ui/toaster";
import {
  featureModuleEditSchema,
  FeatureModuleEditFormData,
} from "@/data/forms/feature-module-schemas";
import { featureModuleEditFields } from "@/data/forms/feature-module-field-configs";
import { IconDotsVertical, IconPencil, IconTrash } from "@tabler/icons-react";

export const Route = createFileRoute(
  "/(project)/projects/$projectId/Features/"
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { t } = useTranslation();
  const { projectId } = Route.useParams();
  const [features, setFeatures] = useState<Module[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const rows = useMemo(() => flattenModuleTree(buildModuleTree(features)), [features]);
  const namesById = useMemo(
    () => new Map(features.map((f) => [f.id, f.name])),
    [features],
  );

  const [moduleToEdit, setModuleToEdit] = useState<Module | null>(null);
  const [moduleToDelete, setModuleToDelete] = useState<Module | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const service = new ModuleService();
        const data = await service.getModulesByProjectId(projectId);
        if (!Array.isArray(data)) {
          throw new Error("Invalid response format");
        }
        setFeatures(data);
        setError(null);
      } catch (err: any) {
        console.error(err);
        setFeatures([]);
        setError(t("features.index.error"));
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, [projectId, t]);

  const handleUpdate = async (values: FeatureModuleEditFormData) => {
    if (!moduleToEdit) return;
    const payload = {
      name: values.name,
      type: values.type,
      description: values.description || "",
      code: values.code,
      priority: Number(values.priority),
    };

    try {
      setSaving(true);
      const service = new ModuleService();
      await service.updateModule(moduleToEdit.id, payload);
      setFeatures((prev) =>
        prev.map((f) => (f.id === moduleToEdit.id ? { ...f, ...payload } : f))
      );
      toaster.create({
        title: t("features.edit.success"),
        description: t("features.edit.success_description", {
          type: values.type,
          name: values.name,
        }),
        type: "success",
        duration: 3000,
      });
      setModuleToEdit(null);
    } catch (err) {
      console.error(err);
      toaster.create({
        title: t("features.edit.error"),
        description: t("features.edit.error_description"),
        type: "error",
        duration: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!moduleToDelete) return;
    try {
      setDeleting(true);
      const service = new ModuleService();
      await service.deleteModule(moduleToDelete.id);
      setFeatures((prev) => prev.filter((f) => f.id !== moduleToDelete.id));
      toaster.create({
        title: t("features.delete.success"),
        type: "success",
        duration: 3000,
      });
      setModuleToDelete(null);
    } catch (err) {
      console.error(err);
      toaster.create({
        title: t("features.index.delete_error"),
        type: "error",
        duration: 3000,
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg" color="fg.heading">
          {t("features.index.title")}
        </Heading>
        <Link
          to="/projects/$projectId/Features/CreateFeatureModuleForm"
          params={{ projectId }}
        >
          <Button colorPalette="brand">+ {t("features.index.create_button")}</Button>
        </Link>
      </Flex>

      {loading ? (
        <Flex justify="center" py={10}>
          <Spinner size="lg" color="brand.solid" />
        </Flex>
      ) : error ? (
        <Text color="fg.error">{error}</Text>
      ) : Array.isArray(features) && features.length === 0 ? (
        <Text color="fg.subtle">{t("features.index.empty")}</Text>
      ) : Array.isArray(features) ? (
        <Stack gap="6">
          <Table.Root size="md">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>{t("features.index.table.name")}</Table.ColumnHeader>
                <Table.ColumnHeader>{t("features.index.table.type")}</Table.ColumnHeader>
                <Table.ColumnHeader>{t("features.index.table.parent")}</Table.ColumnHeader>
                <Table.ColumnHeader>{t("features.index.table.description")}</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">
                  {t("features.index.table.actions")}
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rows.map((item) => (
                <Table.Row key={item.id}>
                  <Table.Cell>
                    <Flex align="center" gap={2} pl={(item.depth - 1) * 6}>
                      {item.depth > 1 && <LuCornerDownRight />}
                      <Text fontWeight={item.depth === 1 ? "semibold" : "normal"}>
                        {item.name}
                      </Text>
                    </Flex>
                  </Table.Cell>
                  <Table.Cell>{item.type}</Table.Cell>
                  <Table.Cell>
                    {item.parent_module_id ? namesById.get(item.parent_module_id) : "-"}
                  </Table.Cell>
                  <Table.Cell>{item.description}</Table.Cell>
                  <Table.Cell textAlign="end">
                    <Menu.Root>
                      <Menu.Trigger asChild>
                        <IconButton
                          variant="ghost"
                          size="sm"
                          aria-label={t("features.index.actions")}
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
                              value="edit"
                              onClick={() => setModuleToEdit(item)}
                            >
                              <IconPencil size={16} />
                              {t("features.index.edit_button")}
                            </Menu.Item>
                            <Menu.Item
                              value="delete"
                              color="fg.error"
                              _hover={{ bg: "bg.error", color: "fg.error" }}
                              onClick={() => setModuleToDelete(item)}
                            >
                              <IconTrash size={16} />
                              {t("features.index.delete_button")}
                            </Menu.Item>
                          </Menu.Content>
                        </Menu.Positioner>
                      </Portal>
                    </Menu.Root>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Stack>
      ) : (
        <Text color="fg.error">{t("features.index.error")}</Text>
      )}

      <AppDialog
        open={moduleToEdit !== null}
        onOpenChange={(details) => {
          if (!details.open && !saving) setModuleToEdit(null);
        }}
        title={t("features.edit.title")}
        showCloseTrigger
        closeButtonLabel={t("features.dialog.cancel")}
      >
        {moduleToEdit ? (
          <DynamicForm
            key={moduleToEdit.id}
            schema={featureModuleEditSchema}
            fields={featureModuleEditFields}
            defaultValues={{
              name: moduleToEdit.name || "",
              type: moduleToEdit.type || "feature",
              description: moduleToEdit.description || "",
              code: moduleToEdit.code || "",
              priority: moduleToEdit.priority || 1,
            }}
            onSubmit={handleUpdate}
            submitText={t("features.edit.submit")}
            submitLoading={saving}
            layout="vertical"
            spacing={4}
          />
        ) : null}
      </AppDialog>

      <AppDialog
        open={moduleToDelete !== null}
        onOpenChange={(details) => {
          if (!details.open && !deleting) setModuleToDelete(null);
        }}
        title={t("features.delete.title")}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setModuleToDelete(null)}
              disabled={deleting}
            >
              {t("features.dialog.cancel")}
            </Button>
            <Button colorPalette="red" onClick={handleDelete} loading={deleting}>
              {t("features.delete.confirm")}
            </Button>
          </>
        }
      >
        <Text color="fg.subtle">
          {t("features.delete.description", { name: moduleToDelete?.name ?? "" })}
        </Text>
      </AppDialog>
    </Box>
  );
}
