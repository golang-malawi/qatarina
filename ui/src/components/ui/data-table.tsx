import * as React from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  NativeSelect,
  Spinner,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  LuArrowDown,
  LuArrowUp,
  LuArrowUpDown,
  LuChevronLeft,
  LuChevronRight,
  LuChevronsLeft,
  LuChevronsRight,
} from "react-icons/lu";

export type DataTableColumnMeta = {
  align?: "start" | "center" | "end";
  width?: string;
};

export interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  isLoading?: boolean;
  emptyMessage?: string;
  enableSorting?: boolean;
  enablePagination?: boolean;
  showGlobalFilter?: boolean;
  filterPlaceholder?: string;
  pageSize?: number;
  onRowClick?: (row: TData) => void;
}

export function DataTable<TData>({
  data,
  columns,
  isLoading = false,
  emptyMessage = "No results",
  enableSorting = true,
  enablePagination = true,
  showGlobalFilter = false,
  filterPlaceholder = "Search",
  pageSize = 10,
  onRowClick,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize,
  });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    enableSorting,
    globalFilterFn: "includesString",
    manualPagination: false,
  });

  const rows = table.getRowModel().rows;
  const headerGroups = table.getHeaderGroups();
  const colSpan = table.getAllColumns().length || 1;

  return (
    <Stack gap="4" w="full">
      {showGlobalFilter && (
        <Input
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          placeholder={filterPlaceholder}
          maxW="sm"
          bg="bg.surface"
          borderColor="border.subtle"
        />
      )}

      <Box
        border="sm"
        borderColor="border.subtle"
        borderRadius="xl"
        overflow="hidden"
        bg="bg.surface"
      >
        <Box overflowX="auto">
          <Table.Root size="md" variant="line">
            <Table.Header>
              {headerGroups.map((headerGroup) => (
                <Table.Row key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const meta = header.column.columnDef.meta as DataTableColumnMeta | undefined;
                    const canSort = enableSorting && header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    const sortIcon = sorted === "asc" ? LuArrowUp : sorted === "desc" ? LuArrowDown : LuArrowUpDown;
                    return (
                      <Table.ColumnHeader
                        key={header.id}
                        textAlign={meta?.align ?? "start"}
                        style={{ width: meta?.width }}
                      >
                        {header.isPlaceholder ? null : canSort ? (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={header.column.getToggleSortingHandler()}
                            justifyContent="flex-start"
                            px="1"
                            py="1"
                          >
                            <HStack gap="1.5">
                              <Text fontSize="xs" fontWeight="semibold">
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                              </Text>
                              <Icon as={sortIcon} boxSize="3.5" color="fg.subtle" />
                            </HStack>
                          </Button>
                        ) : (
                          <Text fontSize="xs" fontWeight="semibold">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </Text>
                        )}
                      </Table.ColumnHeader>
                    );
                  })}
                </Table.Row>
              ))}
            </Table.Header>
            <Table.Body>
              {isLoading && (
                <Table.Row>
                  <Table.Cell colSpan={colSpan} py="12">
                    <Flex align="center" justify="center" gap="3">
                      <Spinner size="sm" color="fg.subtle" />
                      <Text fontSize="sm" color="fg.subtle">
                        Loading...
                      </Text>
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              )}
              {!isLoading && rows.length === 0 && (
                <Table.Row>
                  <Table.Cell colSpan={colSpan} py="12">
                    <Text fontSize="sm" color="fg.subtle" textAlign="center">
                      {emptyMessage}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              )}
              {!isLoading &&
                rows.map((row) => (
                  <Table.Row
                    key={row.id}
                    _hover={
                      onRowClick
                        ? { bg: "bg.subtle", cursor: "pointer" }
                        : undefined
                    }
                    cursor={onRowClick ? "pointer" : "default"}
                    onClick={
                      onRowClick ? () => onRowClick(row.original) : undefined
                    }
                  >
                    {row.getVisibleCells().map((cell) => {
                      const meta = cell.column.columnDef.meta as
                        | DataTableColumnMeta
                        | undefined;
                      return (
                        <Table.Cell
                          key={cell.id}
                          textAlign={meta?.align ?? "start"}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </Table.Cell>
                      );
                    })}
                  </Table.Row>
                ))}
            </Table.Body>
          </Table.Root>
        </Box>
      </Box>

      {enablePagination && (
        <Flex
          align="center"
          justify="space-between"
          gap="4"
          wrap="wrap"
        >
          <HStack gap="2" flexWrap="wrap">
            <Text fontSize="sm" color="fg.subtle">
              Rows per page
            </Text>
            <NativeSelect.Root
              size="sm"
              maxW="24"
              bg="bg.surface"
              borderColor="border.subtle"
            >
              <NativeSelect.Field
                value={table.getState().pagination.pageSize}
                onChange={(event) => {
                  table.setPageSize(Number(event.target.value));
                }}
              >
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
          </HStack>

          <Text fontSize="sm" color="fg.subtle">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </Text>

          <HStack gap="1">
            <IconButton
              aria-label="First page"
              size="sm"
              variant="ghost"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <LuChevronsLeft />
            </IconButton>
            <IconButton
              aria-label="Previous page"
              size="sm"
              variant="ghost"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <LuChevronLeft />
            </IconButton>
            <IconButton
              aria-label="Next page"
              size="sm"
              variant="ghost"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <LuChevronRight />
            </IconButton>
            <IconButton
              aria-label="Last page"
              size="sm"
              variant="ghost"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <LuChevronsRight />
            </IconButton>
          </HStack>
        </Flex>
      )}
    </Stack>
  );
}
