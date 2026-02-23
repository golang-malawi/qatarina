import { AppDataTable, AppTableColumn } from "@/components/ui/app-data-table";
import { findTestCaseAllQueryOptions } from "@/data/queries/test-cases";
import { Button, Flex, Heading, HStack } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { markTestCaseAsDraft } from "@/services/TestCaseService";
import { toaster } from "@/components/ui/toaster";
import type { components } from "@/lib/api/v1";
import { LuEye, LuPencil } from "react-icons/lu";
import React from "react";

export const Route = createFileRoute("/workspace/test-cases/")({
  component: TestCasePage,
});

type TestCase = components["schemas"]["schema.TestCaseResponse"];

type TestCaseListResponse =
  components["schemas"]["schema.TestCaseListResponse"];

const columns: AppTableColumn<TestCase>[] = [
  { key: "code", header: "Code", sortKey: "code" },
  { key: "title", header: "Title", sortKey: "title" },
  { key: "kind", header: "Kind", sortKey: "kind" },
  {
    key: "is_draft",
    header: "Draft",
    type: "enum",
    sortKey: "is_draft",
    enumOptions: {
      map: {
        true: { label: "Draft", colorPalette: "orange" },
        false: { label: "Active", colorPalette: "green" },
      },
    },
    align: "center",
    width: "120px",
  },
  {
    key: "created_at",
    header: "Created",
    type: "date",
    sortKey: "created_at",
    align: "end",
    width: "140px",
  },
];

function TestCasePage() {
  const queryClient = useQueryClient();

  const markDraftMutation = useMutation({
    mutationFn: async (id: string) => await markTestCaseAsDraft(id),
    onSuccess: () => {
      toaster.create({
        title: "Success",
        description: "Marked as draft",
        type: "success",
      });
      queryClient.invalidateQueries({
        queryKey: ["get", "/v1/test-cases"],
      });
    },
    onError: () => {
      toaster.create({
        title: "Error",
        description: "Failed to mark as draft",
        type: "error",
      });
    },
  });

  const queryFactory = React.useCallback(
    ({ page, pageSize, sortBy, sortOrder, search }) => ({
      ...findTestCaseAllQueryOptions({
        page,
        pageSize,
        sortBy,
        sortOrder,
        search,
      }),
    }),
    []
  );

  return (
    <div>
      <Heading color="fg.heading">Test Cases</Heading>

      <Flex mb={4} mt={2} gap={3} alignItems="center" justify="space-between" wrap="wrap">
        <HStack gap="3" flexWrap="wrap">
          <Link to="/workspace/test-cases/new">
            <Button colorPalette="brand">Create New</Button>
          </Link>
          <Button colorPalette="success">Import from Excel</Button>
          <Button colorPalette="success">Import from Google Sheets</Button>
        </HStack>
      </Flex>

      <AppDataTable<TestCase, TestCaseListResponse>
        query={queryFactory}
        columns={columns}
        defaultSort={{ key: "created_at", desc: true }}
        showGlobalFilter
        filterPlaceholder="Search test cases"
        rowActions={[
          { name: "view", label: "View", icon: LuEye },
          { name: "edit", label: "Edit", icon: LuPencil },
          {
            name: "mark-draft",
            label: "Mark as Draft",
            onClick: (row) =>
              row.id && markDraftMutation.mutate(String(row.id)),
          },
          { name: "delete", label: "Delete", color: "fg.error" },
        ]}
      />
    </div>
  );
}
