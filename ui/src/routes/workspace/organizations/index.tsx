import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Box,
  Button,
  Flex,
  Heading,
  Table,
} from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { toaster } from "@/components/ui/toaster";
import $api from "@/lib/api/query";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import { useTranslation } from "react-i18next";

countries.registerLocale(enLocale);

export const Route = createFileRoute("/workspace/organizations/")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData($api.queryOptions("get", "/v1/orgs")),
  component: OrgsPage,
});

function OrgsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const orgsQueryOptions = $api.queryOptions("get", "/v1/orgs");
  const { data: { orgs = [] } = {} } = $api.useQuery("get", "/v1/orgs");
  const deleteMutation = $api.useMutation("delete", "/v1/orgs/{orgID}");

  const handleDelete = (orgID: number, name: string) => {
    if (confirm(t("organizations.delete.confirm", { name }))) {
      deleteMutation.mutate(
        { params: { path: { orgID: orgID.toString() } } },
        {
          onSuccess: () => {
            toaster.create({
              title: t("organizations.delete.success_title"),
              description: t("organizations.delete.success", { name }),
              type: "success",
            });
            queryClient.setQueryData(
              orgsQueryOptions.queryKey,
              (oldData: any) => {
                if (!oldData) return oldData;
                return {
                  ...oldData,
                  orgs: oldData.orgs.filter((o: any) => o.id !== orgID),
                };
              }
            );
            queryClient.invalidateQueries({
              queryKey: orgsQueryOptions.queryKey,
            });
          },
          onError: (error: any) => {
            toaster.create({
              title: t("organizations.delete.error_title"),
              description: t("organizations.delete.error", { error: error.message }),
              type: "error",
            });
          },
        }
      );
    }
  };

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg" color="fg.heading">
          {t("organizations.title")}
        </Heading>
        <Link to="/workspace/organizations/new">
          <Button colorPalette="brand">{t("organizations.create_button")}</Button>
        </Link>
      </Flex>

      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>{t("organizations.column.name")}</Table.ColumnHeader>
            <Table.ColumnHeader>{t("organizations.column.country")}</Table.ColumnHeader>
            <Table.ColumnHeader>{t("organizations.column.website")}</Table.ColumnHeader>
            <Table.ColumnHeader>{t("organizations.column.created_at")}</Table.ColumnHeader>
            <Table.ColumnHeader>{t("organizations.column.actions")}</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {(orgs ?? []).map((org: any) => (
            <Table.Row key={org.id}>
              <Table.Cell>{org.name}</Table.Cell>
              <Table.Cell>
                {org.country
                  ? countries.getName(org.country, "en") || org.country
                  : t("common.not_available")}
              </Table.Cell>
              <Table.Cell>
                {org.website_url ? (
                  <a href={org.website_url} target="_blank" rel="noopener noreferrer">
                    {org.website_url}
                  </a>
                ) : t("common.not_available")}
              </Table.Cell>
              <Table.Cell>
                {new Date(org.created_at).toLocaleDateString()}
              </Table.Cell>
              <Table.Cell>
                <Flex gap={2}>
                  <Link to="/workspace/organizations/$id" params={{ id: org.id.toString() }}>
                    <Button size="sm" colorPalette="brand">{t("organizations.view")}</Button>
                  </Link>
                  <Link to="/workspace/organizations/$id/edit" params={{ id: org.id.toString() }}>
                    <Button size="sm" colorPalette="brand">{t("organizations.edit")}</Button>
                  </Link>
                  <Button
                    size="sm"
                    colorPalette="brand"
                    loading={deleteMutation.isPending}
                    onClick={() => handleDelete(org.id, org.name)}
                  >
                    {t("organizations.delete")}
                  </Button>
                </Flex>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
