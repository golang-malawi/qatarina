import {
  createListCollection,
  ListCollection,
  Portal,
  Select,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import ModuleService, {
  buildModuleTree,
  flattenModuleTree,
  moduleSubtreeIds,
} from "@/services/ModuleService";

export type SelectParentModuleProps = {
  projectId: string;
  value?: string;
  onChange: (value: string) => void;
  /** The module being edited, it and its descendants cannot be chosen as its parent */
  moduleId?: string;
};

type Option = { label: string; value: string };

export default function SelectParentModule({
  projectId,
  value,
  onChange,
  moduleId,
}: SelectParentModuleProps) {
  const [options, setOptions] = useState<ListCollection<Option>>(
    createListCollection<Option>({ items: [] }),
  );

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const modules = await new ModuleService().getModulesByProjectId(projectId);
        const tree = buildModuleTree(modules);
        const excluded = moduleId ? moduleSubtreeIds(tree, moduleId) : new Set<string>();
        const items = [{ label: "None (top level)", value: "" }].concat(
          flattenModuleTree(tree)
            .filter((node) => !excluded.has(node.id))
            .map((node) => ({
              label: `${"    ".repeat(node.depth - 1)}${node.name}`,
              value: node.id,
            })),
        );
        setOptions(createListCollection({ items }));
      } catch (error) {
        console.error("Failed to fetch project modules:", error);
      }
    };

    if (projectId) {
      fetchModules();
    }
  }, [projectId, moduleId]);

  return (
    <Select.Root
      collection={options}
      value={[value ?? ""]}
      onValueChange={(e) => onChange(e.value[0] ?? "")}
    >
      <Select.HiddenSelect />
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText placeholder="None (top level)" />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content>
            {options.items.map((item) => (
              <Select.Item item={item} key={item.value}>
                {item.label}
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );
}
