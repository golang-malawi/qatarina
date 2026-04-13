import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Box,
  Heading,
  Input,
  Textarea,
  Button,
  Flex,
  Select,
  createListCollection,
  Portal,
} from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { useSuspenseQuery } from "@tanstack/react-query";
import { findProjectsQueryOptions } from "@/data/queries/projects";
import ModuleService, { Module } from "@/services/ModuleService";
import { apiClient } from "@/lib/api/query";
import SelectTestKind from "@/components/form/SelectTestKind";

export const Route = createFileRoute("/workspace/test-cases/inbox/suggest")({
  component: SuggestTestCaseForm,
});

function SuggestTestCaseForm() {
  const navigate = useNavigate();
  const { data: projects } = useSuspenseQuery(findProjectsQueryOptions);

  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [kind, setKind] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const projectOptions = createListCollection({
    items: (projects?.projects ?? []).map((p: any) => ({
      label: p.title,
      value: String(p.id),
    })),
  });

  const moduleOptions = createListCollection({
    items: modules.map((m) => ({
      label: m.name,
      value: m.name,
    })),
  });

  useEffect(() => {
    if (selectedProjectId) {
      const moduleService = new ModuleService();
      moduleService.getModulesByProjectId(selectedProjectId).then(setModules);
    } else {
      setModules([]);
    }
  }, [selectedProjectId]);

  async function handleSubmit() {
    try {
      await apiClient.request("post", "/v1/test-cases/suggest", {
        body: {
          project_id: parseInt(selectedProjectId),
          kind,
          feature_or_module: selectedModule,
          title,
          description,
        },
      });
      toaster.success({
        title: "Test case suggestion submitted successfully!",
        description: "Pending review and approval by project maintainers.",
        duration: 5000,
      });
      navigate({ to: "/workspace/test-cases/inbox" });
    } catch (err: any) {
      toaster.error({
        title: "Failed to submit suggestion",
        description:
          err?.message ||
          "An error occurred while submitting your test case suggestion.",
        duration: 8000,
      });
    }
  }

  return (
    <Box p={6}>
      <Heading size="lg" mb={4}>
        Suggest a New Test Case
      </Heading>
      <Flex direction="column" gap={4}>
        <Select.Root
          collection={projectOptions}
          value={selectedProjectId ? [selectedProjectId] : []}
          onValueChange={(e) => setSelectedProjectId(e.value[0] ?? "")}
        >
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger>
              <Select.ValueText placeholder="Select project" />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content>
                {projectOptions.items.map((item) => (
                  <Select.Item key={item.value} item={item}>
                    {item.label}
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>

        <Select.Root
          collection={moduleOptions}
          value={selectedModule ? [selectedModule] : []}
          onValueChange={(e) => setSelectedModule(e.value[0] ?? "")}
        >
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger>
              <Select.ValueText placeholder="Select module/feature" />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content>
                {moduleOptions.items.map((item) => (
                  <Select.Item key={item.value} item={item}>
                    {item.label}
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>

        <SelectTestKind value={kind} onChange={(val) => setKind(val)} />

        <Input
          placeholder="Test case title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Textarea
          placeholder="Detailed description of the test case"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <Button
          colorPalette="brand"
          onClick={handleSubmit}
          disabled={
            !selectedProjectId || !selectedModule || !kind || !title || !description
          }
        >
          Submit Suggestion
        </Button>
      </Flex>
    </Box>
  );
}