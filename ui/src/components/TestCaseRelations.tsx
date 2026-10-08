import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  chakra,
  createListCollection,
  Field,
  Flex,
  Heading,
  IconButton,
  Input,
  Select,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FiTrash2 } from "react-icons/fi";
import { AppDialog } from "@/components/ui/app-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toaster } from "@/components/ui/toaster";
import { testCasesByProjectIdQueryOptions } from "@/data/queries/test-cases";
import {
  useCreateTestCaseRelationMutation,
  useDeleteTestCaseRelationMutation,
  useTestCaseRelationsQuery,
} from "@/services/TestCaseService";
import type { components } from "@/lib/api/v1";

type Relation = components["schemas"]["schema.TestCaseRelationResponse"];
type RelationKind = NonNullable<
  components["schemas"]["schema.CreateTestCaseRelationRequest"]["relation_kind"]
>;

// How a relation reads from this test case's side, e.g. "Depends on" vs "Required by"
const RELATION_LABELS: Record<RelationKind, { outgoing: string; incoming: string }> = {
  depends_on: { outgoing: "Depends on", incoming: "Required by" },
  related_to: { outgoing: "Related to", incoming: "Related to" },
  duplicates: { outgoing: "Duplicates", incoming: "Duplicated by" },
  branched_from: { outgoing: "Branched from", incoming: "Branched into" },
};

const GROUP_ORDER = [
  "Depends on",
  "Required by",
  "Related to",
  "Duplicates",
  "Duplicated by",
  "Branched from",
  "Branched into",
];

const relationKindOptions = createListCollection({
  items: (Object.keys(RELATION_LABELS) as RelationKind[]).map((kind) => ({
    value: kind,
    label: RELATION_LABELS[kind].outgoing,
  })),
});

function relationLabel(relation: Relation) {
  const labels = RELATION_LABELS[relation.relation_kind as RelationKind];
  if (!labels) return relation.relation_kind ?? "";
  return relation.direction === "incoming" ? labels.incoming : labels.outgoing;
}

function errorDetail(err: unknown, fallback: string) {
  return (err as { detail?: string })?.detail ?? fallback;
}

type TestCaseRelationsProps = {
  projectId: string;
  testCaseId: string;
};

export function TestCaseRelations({ projectId, testCaseId }: TestCaseRelationsProps) {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useTestCaseRelationsQuery(testCaseId);
  const deleteMutation = useDeleteTestCaseRelationMutation();

  // A relation shows on both test cases, so refresh every relations list
  const invalidateRelations = () =>
    queryClient.invalidateQueries({
      queryKey: ["get", "/v1/test-cases/{testCaseID}/relations"],
    });

  const groups = useMemo(() => {
    const byLabel = new Map<string, Relation[]>();
    for (const relation of data?.relations ?? []) {
      const label = relationLabel(relation);
      byLabel.set(label, [...(byLabel.get(label) ?? []), relation]);
    }
    return GROUP_ORDER.filter((label) => byLabel.has(label)).map((label) => ({
      label,
      relations: byLabel.get(label)!,
    }));
  }, [data]);

  const handleDelete = async (relation: Relation) => {
    try {
      await deleteMutation.mutateAsync({
        params: { path: { testCaseID: testCaseId, relationID: relation.id ?? "" } },
      });
      await invalidateRelations();
      toaster.success({ title: "Relation removed" });
    } catch (err) {
      toaster.error({
        title: "Failed to remove relation",
        description: errorDetail(err, "Could not remove the relation."),
      });
      throw err;
    }
  };

  return (
    <Stack gap={4} mt={4}>
      <Flex justify="space-between" align="center" gap={4} wrap="wrap">
        <Heading size="sm" color="fg.heading">
          Related test cases
        </Heading>
        <AddRelationDialog
          projectId={projectId}
          testCaseId={testCaseId}
          onCreated={invalidateRelations}
        />
      </Flex>

      {isLoading ? (
        <Spinner size="md" color="brand.solid" />
      ) : error ? (
        <Text color="fg.error">Error loading relations</Text>
      ) : groups.length === 0 ? (
        <Text fontSize="sm" color="fg.subtle">
          No related test cases yet.
        </Text>
      ) : (
        groups.map((group) => (
          <Box key={group.label}>
            <Text fontWeight="semibold" fontSize="sm" color="fg.muted" mb={2}>
              {group.label}
            </Text>
            <Stack gap={2}>
              {group.relations.map((relation) => {
                const other = relation.other_test_case;
                return (
                  <Flex
                    key={relation.id}
                    justify="space-between"
                    align="center"
                    gap={3}
                    p={3}
                    bg="bg.subtle"
                    rounded="md"
                    border="1px solid"
                    borderColor="border.subtle"
                  >
                    <Link
                      to="/projects/$projectId/test-cases/$testCaseId"
                      params={{
                        projectId: String(other?.project_id || projectId),
                        testCaseId: other?.id ?? "",
                      }}
                      style={{ minWidth: 0 }}
                    >
                      <Text fontSize="sm" truncate>
                        <strong>{other?.code}</strong> {other?.title}
                      </Text>
                    </Link>
                    <ConfirmDialog
                      title="Remove relation"
                      description={`Remove "${group.label.toLowerCase()} ${other?.code ?? ""}" from this test case?`}
                      confirmLabel="Remove"
                      onConfirm={() => handleDelete(relation)}
                      trigger={
                        <IconButton
                          aria-label={`Remove relation to ${other?.code ?? "test case"}`}
                          size="xs"
                          variant="ghost"
                          colorPalette="red"
                        >
                          <FiTrash2 />
                        </IconButton>
                      }
                    />
                  </Flex>
                );
              })}
            </Stack>
          </Box>
        ))
      )}
    </Stack>
  );
}

type AddRelationDialogProps = {
  projectId: string;
  testCaseId: string;
  onCreated: () => Promise<unknown>;
};

function AddRelationDialog({ projectId, testCaseId, onCreated }: AddRelationDialogProps) {
  const createMutation = useCreateTestCaseRelationMutation();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<RelationKind>("depends_on");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [relatedId, setRelatedId] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: candidatesData, isFetching } = useQuery({
    ...testCasesByProjectIdQueryOptions(projectId, {
      page: 1,
      pageSize: 20,
      search: debouncedSearch || undefined,
    }),
    enabled: open,
  });

  const candidates = useMemo(
    () => (candidatesData?.test_cases ?? []).filter((tc) => tc.id && tc.id !== testCaseId),
    [candidatesData, testCaseId],
  );

  const reset = () => {
    setKind("depends_on");
    setSearch("");
    setRelatedId("");
  };

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        params: { path: { testCaseID: testCaseId } },
        body: { related_test_case_id: relatedId, relation_kind: kind },
      });
      await onCreated();
      toaster.success({ title: "Relation added" });
      setOpen(false);
      reset();
    } catch (err) {
      toaster.error({
        title: "Failed to add relation",
        description: errorDetail(err, "Could not add the relation."),
      });
    }
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={(details) => {
        setOpen(details.open);
        if (!details.open) reset();
      }}
      title="Add related test case"
      trigger={
        <Button size="sm" colorPalette="brand">
          Add relation
        </Button>
      }
      footer={
        <>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            colorPalette="brand"
            loading={createMutation.isPending}
            disabled={!relatedId}
            onClick={handleCreate}
          >
            Add relation
          </Button>
        </>
      }
    >
      <Stack gap={4}>
        <Field.Root>
          <Field.Label>This test case…</Field.Label>
          {/* No Portal: inside a modal dialog a portalled menu sits outside the
              dialog's focus trap and cannot be clicked */}
          <Select.Root
            collection={relationKindOptions}
            value={[kind]}
            onValueChange={(e) => setKind((e.value[0] as RelationKind) ?? "depends_on")}
            positioning={{ sameWidth: true }}
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText placeholder="Select relation" />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Select.Positioner>
              {/* Keep the open menu above the fields that follow it in the dialog */}
              <Select.Content zIndex="popover">
                {relationKindOptions.items.map((item) => (
                  <Select.Item item={item} key={item.value}>
                    {item.label}
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Select.Root>
        </Field.Root>

        <Field.Root>
          <Field.Label>Test case</Field.Label>
          <Input
            placeholder="Search test cases"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setRelatedId("");
            }}
          />
          <Box
            w="full"
            mt={2}
            maxH="56"
            overflowY="auto"
            border="1px solid"
            borderColor="border.subtle"
            rounded="md"
            role="listbox"
            aria-label="Matching test cases"
          >
            {isFetching && candidates.length === 0 ? (
              <Flex p={3} justify="center">
                <Spinner size="sm" color="brand.solid" />
              </Flex>
            ) : candidates.length === 0 ? (
              <Text p={3} fontSize="sm" color="fg.subtle">
                No matching test cases
              </Text>
            ) : (
              candidates.map((tc) => {
                const selected = tc.id === relatedId;
                return (
                  <chakra.button
                    key={tc.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    display="block"
                    w="full"
                    textAlign="left"
                    px={3}
                    py={2}
                    fontSize="sm"
                    bg={selected ? "brand.subtle" : undefined}
                    color={selected ? "brand.fg" : undefined}
                    _hover={{ bg: selected ? "brand.subtle" : "bg.subtle" }}
                    borderBottom="1px solid"
                    borderColor="border.subtle"
                    onClick={() => setRelatedId(tc.id!)}
                  >
                    <Text truncate>
                      <strong>{tc.code}</strong> {tc.title}
                    </Text>
                  </chakra.button>
                );
              })
            )}
          </Box>
        </Field.Root>
      </Stack>
    </AppDialog>
  );
}
