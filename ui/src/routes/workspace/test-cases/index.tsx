import { AppDataTable } from "@/components/ui/app-data-table";
import {
  findTestCaseAllQueryOptions,
  TestCaseListQueryParams,
} from "@/data/queries/test-cases";
import { Button, Flex, Heading, HStack } from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  markTestCaseAsDraft,
  unMarkTestCaseAsDraft, 
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
          </Button>
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
            name: "toggle-draft",
            label: (row) =>
              row.is_draft
                ? t("test_cases.unMark_as_draft")
                : t("test_cases.mark_as_draft"),
            onClick: async (row) => {
              if (!row.id) return;
              try {
                if (row.is_draft) {
                  await unMarkTestCaseAsDraft(String(row.id));
                  toaster.success({ title: t("test_cases.unMark_draft.success") });
                } else {
                  await markTestCaseAsDraft(String(row.id));
                  toaster.success({ title: t("test_cases.mark_draft.success") });
                }
                queryClient.invalidateQueries(findTestCaseAllQueryOptions({}));
              } catch (err: any) {
                toaster.error({
                  title: row.is_draft
                    ? t("test_cases.unmark_draft.error")
                    : t("test_cases.mark_draft.error"),
                  description: err?.message,
                });
              }
            },
          },
        ]}
      />
    </div>
  );
}
