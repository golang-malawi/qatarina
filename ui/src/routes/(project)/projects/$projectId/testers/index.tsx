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
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LuPencil, LuTrash } from "react-icons/lu";
import { useProjectTestersQuery, useDeleteTesterMutation } from "@/services/TesterService";
import { toaster } from "@/components/ui/toaster";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/(project)/projects/$projectId/testers/")({
  component: ProjectTestersPage,
});

type Tester = {
  id: string;
  name: string;
  email: string;
  role: string;
};

function ProjectTestersPage() {
  const { t } = useTranslation();
  const { projectId } = Route.useParams();
  const projectID = Number(projectId);
  const navigate = useNavigate();
  const { data, isPending, isError, error, refetch } = useProjectTestersQuery(projectID);
  const deleteMutation = useDeleteTesterMutation();

  if (isPending) {
    return (
      <Flex justify="center" py={10}>
        <Spinner size="lg" color="brand.solid" />
      </Flex>
    );
  }

  if (isError) {
    return (
      <Text color="fg.error">
        {t("testers.error.load")}: {error?.detail ?? error?.title ?? t("common.unknown_error")}
      </Text>
    );
  }

  const testers: Tester[] =
    data?.testers?.map((t: any) => ({
      id: String(t.user_id),
      name: t.name,
      email: t.email ?? t("common.not_available"),
      role: t.role,
    })) ?? [];

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("testers.actions.remove_confirm"))) return;
    try {
      await deleteMutation.mutateAsync({
        params: { path: { testerID: id } },
      });
      toaster.success({ title: t("testers.actions.remove_success") });
      refetch();
    } catch (err) {
      console.error("Failed to delete tester", err);
      toaster.error({ title: t("testers.actions.remove_error") });
    }
  };

  const handleEdit = (id: string) => {
    navigate({
      to: "/projects/$projectId/testers/edit/$testerId",
      params: { projectId, testerId: id },
    });
  };

  return (
    <Box p={6}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg" color="fg.heading">
          {t("testers.project_title")}
        </Heading>
        <Button
          colorPalette="brand"
          onClick={() =>
            navigate({
              to: "/projects/$projectId/testers/new",
              params: { projectId },
            })
          }
        >
          + {t("testers.add_button")}
        </Button>
      </Flex>

      {/* Total Testers */}
      <Text mb={4} color="fg.muted">
        {t("testers.total")}: <strong>{testers.length}</strong>
      </Text>

      {/* Tester Table */}
      <Stack gap="6">
        <Table.Root size="md">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>{t("testers.table.id")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("testers.table.name")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("testers.table.email")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("testers.table.role")}</Table.ColumnHeader>
              <Table.ColumnHeader>{t("testers.table.actions")}</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {testers.map((tester) => (
              <Table.Row key={tester.id}>
                <Table.Cell>{tester.id}</Table.Cell>
                <Table.Cell>{tester.name}</Table.Cell>
                <Table.Cell>{tester.email}</Table.Cell>
                <Table.Cell>{tester.role}</Table.Cell>
                <Table.Cell>
                  <Flex gap={2}>
                    <IconButton
                      aria-label={t("testers.actions.edit")}
                      onClick={() => handleEdit(tester.id)}
                      colorPalette="info"
                      size="sm"
                      children={<LuPencil />}
                    />
                    <IconButton
                      aria-label={t("testers.actions.delete")}
                      onClick={() => handleDelete(tester.id)}
                      colorPalette="danger"
                      size="sm"
                      children={<LuTrash />}
                    />
                  </Flex>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Stack>
    </Box>
  );
}
