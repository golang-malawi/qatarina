import {
  Box,
  Stack,
  Table,
  Heading,
  Button,
  Flex,
  Spinner,
} from "@chakra-ui/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTestersQuery, useDeleteTesterMutation } from "@/services/TesterService";
import ErrorAlert from "@/components/ui/error-alert";
import { toaster } from "@/components/ui/toaster";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/workspace/testers/")({
  component: ListTesters,
});

function ListTesters() {
  const { t } = useTranslation();
  const { data, isPending, isError, error, refetch } = useTestersQuery();
  const deleteMutation = useDeleteTesterMutation();

  const testers = data?.testers ?? [];

  const handleDelete = async (id: number) => {
    if (!window.confirm(t("testers.actions.delete_confirm"))) return;
    try {
      await deleteMutation.mutateAsync({
        params: { path: { testerID: String(id) } },
      });
      toaster.success({ title: t("testers.actions.delete_success") });
      refetch();
    } catch (err) {
      console.error("Failed to delete tester", err);
      toaster.error({ title: t("testers.actions.delete_error") });
    }
  };

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg" color="fg.heading">
          {t("testers.title")}
        </Heading>

        {/* Optional: Add New Tester button (commented out in original) */}
        {/* <Link to="/workspace/testers/invite">
          <Button colorScheme="teal">+ {t("testers.add_button")}</Button>
        </Link> */}
      </Flex>

      {isPending ? (
        <Flex justify="center" py={10}>
          <Spinner size="lg" color="brand.solid" />
        </Flex>
      ) : isError ? (
        <ErrorAlert message={`${t("testers.error.load")}: ${(error as Error).message}`} />
      ) : (
        <Stack gap="6">
          <Table.Root size="md">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>{t("testers.view.user_id")}</Table.ColumnHeader>
                <Table.ColumnHeader>{t("testers.view.name")}</Table.ColumnHeader>
                <Table.ColumnHeader>{t("testers.view.project")}</Table.ColumnHeader>
                <Table.ColumnHeader>{t("testers.view.role")}</Table.ColumnHeader>
                <Table.ColumnHeader>{t("testers.table.actions")}</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {testers.map((tester) => (
                <Table.Row key={tester.user_id}>
                  <Table.Cell>{tester.user_id}</Table.Cell>
                  <Table.Cell>{tester.name || t("common.not_available")}</Table.Cell>
                  <Table.Cell>{tester.project || t("common.not_available")}</Table.Cell>
                  <Table.Cell>{tester.role || t("common.not_available")}</Table.Cell>
                  <Table.Cell>
                    <Flex gap={2}>
                      <Button variant="outline" colorPalette="brand" size="sm">
                        <Link
                          to={`/workspace/testers/view/$testerId`}
                          params={{ testerId: `${tester.user_id!}` }}
                        >
                          {t("testers.actions.view")}
                        </Link>
                      </Button>
                      <Button
                        colorPalette="danger"
                        onClick={() => handleDelete(tester.user_id!)}
                        size="sm"
                      >
                        {t("testers.actions.delete")}
                      </Button>
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Stack>
      )}
    </Box>
  );
}
