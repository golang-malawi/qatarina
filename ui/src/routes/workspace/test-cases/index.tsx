import { AppDataTable } from "@/components/ui/app-data-table";
import {
  findTestCaseAllQueryOptions,
  TestCaseListQueryParams,
} from "@/data/queries/test-cases";
import { Button, Flex, Heading, HStack } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  markTestCaseAsDraft,
  deleteTestCase,
} from "@/services/TestCaseService";
import { toaster } from "@/components/ui/toaster";
import type { components } from "@/lib/api/v1";
import { LuEye, LuPencil } from "react-icons/lu";
import React from "react";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/workspace/test-cases/")({
  component: TestCasePage,
});

type TestCase = components["schemas"]["schema.TestCaseResponse"];

type TestCaseListResponse =
  components["schemas"]["schema.TestCaseListResponse"];

function TestCasePage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const markDraftMutation = useMutation({
    mutationFn: async (id: string) => await markTestCaseAsDraft(id),
    onSuccess: () => {
      toaster.create({
        title: t("test_cases.toast.success"),
        description: t("test_cases.mark_draft.success"),
        type: "success",
      });
      queryClient.invalidateQueries({
        queryKey: ["get", "/v1/test-cases"],
      });
    },
    onError: () => {
      toaster.create({
        title: t("test_cases.toast.error"),
        description: t("test_cases.mark_draft.error"),
        type: "error",
      });
    },
  });

  const queryFactory = React.useCallback(
    ({
      page,
      pageSize,
      sortBy,
      sortOrder,
      search,
    }: TestCaseListQueryParams) => ({
      ...findTestCaseAllQueryOptions({
        page,
        pageSize,
        sortBy,
        sortOrder,
        search,
      }),
    }),
    [],
  );

  return (
    <div>
      <Heading color="fg.heading">{t("test_cases")}</Heading>

      <Flex
        mb={4}
        mt={2}
        gap={3}
        alignItems="center"
        justify="space-between"
        wrap="wrap"
      >
        <HStack gap="3" flexWrap="wrap">
          <Link to="/workspace/test-cases/new">
            <Button colorPalette="brand">{t("test_cases.create_new")}</Button>
          </Link>
          <Button colorPalette="success">
            {t("test_cases.import_from_excel")}
          </Button>{" "}
        </HStack>
      </Flex>

      <AppDataTable<TestCase, TestCaseListResponse>
        // @ts-expect-error TODO(sevenreup)
        query={queryFactory}
        columns={[
          {
            key: "code",
            header: t("test_cases.column.code"),
            sortKey: "code",
          },
          {
            key: "title",
            header: t("test_cases.column.title"),
            sortKey: "title",
          },
          {
            key: "kind",
            header: t("test_cases.column.kind"),
            sortKey: "kind",
          },
          {
            key: "is_draft",
            header: t("test_cases.column.draft"),
            type: "enum",
            sortKey: "is_draft",
            enumOptions: {
              map: {
                true: {
                  label: t("test_cases.status.draft"),
                  colorPalette: "orange",
                },
                false: {
                  label: t("test_cases.status.active"),
                  colorPalette: "green",
                },
              },
            },
            align: "center",
            width: "120px",
          },
          {
            key: "created_at",
            header: t("test_cases.column.created"),
            type: "date",
            sortKey: "created_at",
            align: "end",
            width: "140px",
          },
        ]}
        defaultSort={{ key: "created_at", desc: true }}
        showGlobalFilter
        filterPlaceholder={t("test_cases.search_placeholder")}
        rowActions={[
          { name: "view", label: t("test_cases.view"), icon: LuEye },
          { name: "edit", label: t("test_cases.edit"), icon: LuPencil },
          {
            name: "mark-draft",
            label: t("test_cases.mark_as_draft"),
            onClick: (row) =>
              row.id && markDraftMutation.mutate(String(row.id)),
          },
          {
            name: "delete",
            label: t("test_cases.delete"),
            color: "fg.error",
            onClick: (row) => {
              if (row.id) {
                deleteTestCase(String(row.id))
                  .then(() => {
                    toaster.success({
                      title: t("test_cases.delete.success"),
                    });
                    queryClient.invalidateQueries(
                      findTestCaseAllQueryOptions({}),
                    );
                  })
                  .catch((err) => {
                    toaster.error({
                      title: t("test_cases.delete.error"),
                      description: err?.message,
                    });
                  });
              }
            },
          },
        ]}
      />
    </div>
  );
}
