import * as React from "react";
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  Menu,
  NativeSelect,
  Portal,
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
import type { UseQueryOptions } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import ErrorAlert from "@/components/ui/error-alert";
import { useNavigate } from "@tanstack/react-router";

export type AppTableColumnType =
  | "text"
  | "number"
  | "date"
  | "enum"
  | "actions";

export type AppTableEnumOption = {
  label?: string;
  colorPalette?: string;
  variant?: "subtle" | "solid";
};

export type AppTableEnumOptions<TData> = {
  map?: Record<string, AppTableEnumOption>;
  render?: (value: unknown, row: TData) => React.ReactNode;
};

export type AppTableRowAction<TData> = {
  name?: string;
  label: string;
  icon?: React.ElementType | React.ReactNode;
  link?: string | ((row: TData) => string);
  href?: string | ((row: TData) => string);
  onClick?: (row: TData) => void;
  color?: string;
  disabled?: boolean | ((row: TData) => boolean);
  isVisible?: boolean | ((row: TData) => boolean);
};

export type AppTableColumn<TData> = {
  key: keyof TData | string;
  header?: string;
  type?: AppTableColumnType;
  align?: "start" | "center" | "end";
  width?: string;
  sortable?: boolean;
  sortKey?: string;
  accessor?: (row: TData) => unknown;
  cell?: (value: unknown, row: TData) => React.ReactNode;
  enumOptions?: AppTableEnumOptions<TData>;
  actions?: AppTableRowAction<TData>[];
};

export type PaginationInfo = {
  total: number;
  page: number;
  pageSize: number;
};

export type TableQueryParams = {
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
  search: string;
};

export type TableQueryOptions<TResponse> = UseQueryOptions<TResponse>;

export type TableQueryFactory<TResponse> = (
  params: TableQueryParams
) => TableQueryOptions<TResponse>;

export interface AppDataTableProps<TData, TResponse> {
  query: TableQueryOptions<TResponse> | TableQueryFactory<TResponse>;
  columns: AppTableColumn<TData>[];
  title?: string;
  description?: string;
  emptyMessage?: string;
  enableSorting?: boolean;
  enablePagination?: boolean;
  showGlobalFilter?: boolean;
  filterPlaceholder?: string;
  pageSize?: number;
  defaultSort?: { key: string; desc?: boolean };
  enableRowSelection?: boolean;
  onRowSelectionChange?: (rows: TData[]) => void;
  onRowClick?: (row: TData) => void;
  rowActions?: AppTableRowAction<TData>[];
  rowActionsLabel?: string;
  dataAccessor?: (response: TResponse | undefined) => TData[];
  paginationAccessor?: (
    response: TResponse | undefined
  ) => PaginationInfo | undefined;
  getRowId?: (row: TData, index: number, parent?: any) => string;
}

function titleize(value: string) {
  return value
    .replace(/[_-]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function resolveData<TData>(response: any): TData[] {
  if (!response) return [];
  if (Array.isArray(response)) return response as TData[];
  if (Array.isArray(response.data)) return response.data as TData[];
  if (Array.isArray(response.items)) return response.items as TData[];
  if (Array.isArray(response.results)) return response.results as TData[];
  if (Array.isArray(response.test_cases)) return response.test_cases as TData[];
  return [];
}

function resolvePagination(response: any): PaginationInfo | undefined {
  if (!response) return undefined;
  if (response.pagination) return response.pagination as PaginationInfo;
  return undefined;
}

function formatDate(value: unknown) {
  if (!value) return "--";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
}

export function AppDataTable<TData, TResponse>({
  query,
  columns,
  title,
  description,
  emptyMessage = "No results",
  enableSorting = true,
  enablePagination = true,
  showGlobalFilter = false,
  filterPlaceholder = "Search",
  pageSize = 10,
  defaultSort,
  enableRowSelection = false,
  onRowSelectionChange,
  onRowClick,
  rowActions,
  rowActionsLabel = "Actions",
  dataAccessor,
  paginationAccessor,
  getRowId,
}: AppDataTableProps<TData, TResponse>) {
  const navigate = useNavigate();
  const [sorting, setSorting] = React.useState<SortingState>(() => {
    if (!defaultSort) return [];
    return [
      {
        id: String(defaultSort.key),
        desc: !!defaultSort.desc,
      },
    ];
  });
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize,
  });
  const [rowSelection, setRowSelection] = React.useState({});

  const sortKeyById = React.useMemo(() => {
    const map = new Map<string, string>();
    columns.forEach((column) => {
      if (column.sortKey) {
        map.set(String(column.key), column.sortKey);
      }
    });
    return map;
  }, [columns]);

  const sortId = sorting[0]?.id ?? (defaultSort ? String(defaultSort.key) : "");
  const sortOrder: "asc" | "desc" = sorting[0]
    ? sorting[0].desc
      ? "desc"
      : "asc"
    : defaultSort?.desc
    ? "desc"
    : "asc";
  const sortBy = sortKeyById.get(sortId) ?? sortId;

  const queryParams = React.useMemo(
    () => ({
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      sortBy,
      sortOrder,
      search: globalFilter,
    }),
    [
      pagination.pageIndex,
      pagination.pageSize,
      sortBy,
      sortOrder,
      globalFilter,
    ]
  );

  const queryOptions = React.useMemo(() => {
    if (typeof query === "function") {
      return query(queryParams);
    }
    return query;
  }, [query, queryParams]);

  const queryResult = useQuery(queryOptions);
  const isServerMode = typeof query === "function";

  const rawData = React.useMemo(() => {
    if (dataAccessor) return dataAccessor(queryResult.data);
    return resolveData<TData>(queryResult.data);
  }, [dataAccessor, queryResult.data]);

  const paginationInfo = React.useMemo(() => {
    if (paginationAccessor) return paginationAccessor(queryResult.data);
    return resolvePagination(queryResult.data);
  }, [paginationAccessor, queryResult.data]);

  const totalRows = paginationInfo?.total ?? rawData.length;
  const pageCount = enablePagination
    ? Math.max(1, Math.ceil(totalRows / pagination.pageSize))
    : 1;

  const resolveActions = React.useCallback(
    (row: TData, actions: AppTableRowAction<TData>[]) =>
      actions.filter((action) => {
        if (typeof action.isVisible === "function") {
          return action.isVisible(row);
        }
        if (action.isVisible === false) {
          return false;
        }
        return true;
      }),
    []
  );

  const renderActionIcon = (icon?: React.ElementType | React.ReactNode) => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    return <Icon as={icon} boxSize="4" color="fg.subtle" />;
  };

  const renderRowActions = React.useCallback(
    (row: TData, actions: AppTableRowAction<TData>[]) => {
      const visibleActions = resolveActions(row, actions);
      if (visibleActions.length === 0) return null;

      return (
        <Menu.Root positioning={{ placement: "bottom-end" }}>
          <Menu.Trigger asChild>
            <Button size="sm" variant="outline" colorPalette="brand">
              {rowActionsLabel}
            </Button>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner zIndex="3000">
              <Menu.Content
                bg="bg.surface"
                border="sm"
                borderColor="border.subtle"
              >
                {visibleActions.map((action) => {
                  const name = action.name ?? action.label;
                  const disabled =
                    typeof action.disabled === "function"
                      ? action.disabled(row)
                      : action.disabled;
                  const href =
                    typeof action.link === "function"
                      ? action.link(row)
                      : action.link ?? action.href;
                  return (
                    <Menu.Item
                      key={name}
                      value={name}
                      disabled={disabled}
                      color={action.color}
                      onClick={() => {
                        if (disabled) return;
                        action.onClick?.(row);
                        if (href) {
                          navigate({ to: href });
                        }
                      }}
                    >
                      <HStack gap="2">
                        {renderActionIcon(action.icon)}
                        <Text>{action.label}</Text>
                      </HStack>
                    </Menu.Item>
                  );
                })}
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
      );
    },
    [navigate, resolveActions, rowActionsLabel]
  );

  React.useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, [sortBy, sortOrder, globalFilter]);

  React.useEffect(() => {
    if (!isServerMode || !enablePagination) return;
    const maxPageIndex = Math.max(0, pageCount - 1);
    setPagination((current) => {
      if (current.pageIndex > maxPageIndex) {
        return { ...current, pageIndex: maxPageIndex };
      }
      return current;
    });
  }, [isServerMode, enablePagination, pageCount]);

  const builtColumns = React.useMemo(() => {
    const columnDefs: ColumnDef<TData, unknown>[] = [];

    if (enableRowSelection) {
      columnDefs.push({
        id: "__select",
        header: ({ table }) => (
          <Checkbox.Root
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onCheckedChange={({ checked }) =>
              table.toggleAllPageRowsSelected(!!checked)
            }
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
          </Checkbox.Root>
        ),
        cell: ({ row }) => (
          <Box onClick={(event) => event.stopPropagation()}>
            <Checkbox.Root
              checked={row.getIsSelected()}
              indeterminate={row.getIsSomeSelected()}
              onCheckedChange={({ checked }) => row.toggleSelected(!!checked)}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
            </Checkbox.Root>
          </Box>
        ),
        enableSorting: false,
        meta: { align: "center", width: "40px" },
      });
    }

    const hasActionsColumn = columns.some((column) =>
      column.type ? column.type === "actions" : column.key === "actions"
    );

    columns.forEach((column) => {
      const type = column.type ?? "text";
      const isAction = type === "actions";
      const header = column.header ?? titleize(String(column.key));
      const metaAlign =
        column.align ??
        (type === "number" || type === "actions" ? "end" : "start");
      const enumOptions = column.enumOptions;

      columnDefs.push({
        id: String(column.key),
        accessorKey: column.accessor ? undefined : (column.key as string),
        accessorFn: column.accessor,
        header,
        enableSorting: column.sortable ?? (enableSorting && !isAction),
        meta: {
          align: metaAlign,
          width: column.width,
        },
        cell: (ctx) => {
          const value = ctx.getValue();
          const row = ctx.row.original;
          if (column.cell) return column.cell(value, row);
          if (type === "actions") {
            const actions = column.actions ?? rowActions ?? [];
            return (
              <Box onClick={(event) => event.stopPropagation()}>
                {renderRowActions(row, actions)}
              </Box>
            );
          }
          if (type === "date") return formatDate(value);
          if (type === "enum") {
            if (enumOptions?.render) return enumOptions.render(value, row);
            const mapping = enumOptions?.map?.[String(value ?? "")];
            if (mapping) {
              return (
                <Badge
                  variant={mapping.variant ?? "subtle"}
                  colorPalette={mapping.colorPalette ?? "gray"}
                >
                  {mapping.label ?? String(value)}
                </Badge>
              );
            }
          }
          return value ? String(value) : "--";
        },
      });
    });

    if (!hasActionsColumn && rowActions && rowActions.length > 0) {
      columnDefs.push({
        id: "__actions",
        header: "",
        enableSorting: false,
        meta: { align: "end", width: "80px" },
        cell: ({ row }) => (
          <Box onClick={(event) => event.stopPropagation()}>
            {renderRowActions(row.original, rowActions)}
          </Box>
        ),
      });
    }

    return columnDefs;
  }, [
    columns,
    enableRowSelection,
    enableSorting,
    rowActions,
    renderRowActions,
  ]);

  const table = useReactTable({
    data: rawData,
    columns: builtColumns,
    state: {
      sorting,
      globalFilter,
      pagination,
      rowSelection,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: isServerMode ? undefined : getFilteredRowModel(),
    getSortedRowModel: isServerMode ? undefined : getSortedRowModel(),
    getPaginationRowModel: isServerMode ? undefined : getPaginationRowModel(),
    manualPagination: isServerMode,
    manualSorting: isServerMode,
    manualFiltering: isServerMode,
    enableSorting,
    enableRowSelection,
    globalFilterFn: isServerMode ? undefined : "includesString",
    pageCount: isServerMode && enablePagination ? pageCount : undefined,
    getRowId,
  });

  React.useEffect(() => {
    if (!onRowSelectionChange) return;
    const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);
    onRowSelectionChange(selectedRows);
  }, [onRowSelectionChange, table, rowSelection]);

  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;
  const colSpan = table.getAllColumns().length || 1;

  return (
    <Stack gap="5" w="full">
      {(title || description) && (
        <Box>
          {title && (
            <Text fontSize="lg" fontWeight="semibold" color="fg.heading">
              {title}
            </Text>
          )}
          {description && (
            <Text mt="1" fontSize="sm" color="fg.subtle">
              {description}
            </Text>
          )}
        </Box>
      )}

      {(showGlobalFilter || enableRowSelection) && (
        <Flex
          align="center"
          justify="space-between"
          gap="4"
          wrap="wrap"
        >
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
          {enableRowSelection && (
            <Text fontSize="sm" color="fg.subtle">
              {table.getSelectedRowModel().rows.length} selected
            </Text>
          )}
        </Flex>
      )}

      {queryResult.isError && (
        <ErrorAlert message={(queryResult.error as Error)?.message ?? "Failed to load data"} />
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
                    const meta = header.column.columnDef.meta as
                      | { align?: "start" | "center" | "end"; width?: string }
                      | undefined;
                    const canSort = enableSorting && header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    const sortIcon =
                      sorted === "asc"
                        ? LuArrowUp
                        : sorted === "desc"
                        ? LuArrowDown
                        : LuArrowUpDown;
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
                            justifyContent={meta?.align === "end" ? "flex-end" : "flex-start"}
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
              {queryResult.isLoading && (
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
              {!queryResult.isLoading && rows.length === 0 && (
                <Table.Row>
                  <Table.Cell colSpan={colSpan} py="12">
                    <Text fontSize="sm" color="fg.subtle" textAlign="center">
                      {emptyMessage}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              )}
              {!queryResult.isLoading &&
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
                        | { align?: "start" | "center" | "end" }
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
        <Flex align="center" justify="space-between" gap="4" wrap="wrap">
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
            Page {table.getState().pagination.pageIndex + 1} of {pageCount}
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
              onClick={() => table.setPageIndex(pageCount - 1)}
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
