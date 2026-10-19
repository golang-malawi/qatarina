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
} from "@chakra-ui/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import ModuleService, {
  Module,
  buildModuleTree,
  flattenModuleTree,
} from "@/services/ModuleService";
import { LuCornerDownRight, LuPencil, LuTrash } from "react-icons/lu";
import { useTranslation } from "react-i18next";

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

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("features.index.delete_confirm"))) return;
    try {
      const service = new ModuleService();
      await service.deleteModule(id);
      // children of a deleted module move to the top level
      setFeatures((prev) =>
        prev
          .filter((f) => f.id !== id)
          .map((f) => (f.parent_module_id === id ? { ...f, parent_module_id: null } : f)),
      );
    } catch (err) {
      console.error(err);
      alert(t("features.index.delete_error"));
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
                <Table.ColumnHeader>{t("features.index.table.actions")}</Table.ColumnHeader>
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
                  <Table.Cell>
                    <Flex gap={2}>
                      <Link
                        to="/projects/$projectId/Features/EditFeatureModuleForm"
                        params={{ projectId }}
                        search={{ moduleId: item.id }}
                      >
                        <IconButton
                          aria-label={t("features.index.edit_button")}
                          colorPalette="brand"
                          variant="outline"
                          size="sm"
                        >
                          <LuPencil />
                        </IconButton>
                      </Link>
                      <IconButton
                        aria-label={t("features.index.delete_button")}
                        onClick={() => handleDelete(item.id)}
                        colorPalette="danger"
                        size="sm"
                      >
                        <LuTrash />
                      </IconButton>
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Stack>
      ) : (
        <Text color="fg.error">{t("features.index.error")}</Text>
      )}
    </Box>
  );
}
