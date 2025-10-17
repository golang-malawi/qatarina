import {
  createListCollection,
  ListCollection,
  Portal,
  Select,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import ModuleService, { Module } from "@/services/ModuleService";

export type SelectFeatureModuleProps = {
  projectId: string;
  onChange: (value: string) => void;
  value?: string;
};

export default function SelectFeatureModule({
  projectId,
  onChange,
  value,
}: SelectFeatureModuleProps) {
  const [featureModules, setFeatureModules] = useState<
    ListCollection<{ label: string; value: string }>
  >(createListCollection<{ label: string; value: string }>({ items: [] }));

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const moduleService = new ModuleService();
        const modules: Module[] = await moduleService.getModulesByProjectId(projectId);
        const items = modules.map((module) => ({
          label: module.name,
          value: module.id,
        }));
        setFeatureModules(createListCollection({ items }));
      } catch (error) {
        console.error("Failed to fetch project modules:", error);
      }
    };

    if (projectId) {
      fetchModules();
    }
  }, [projectId]);

  return (
    <Select.Root
      collection={featureModules}
      value={value ? [value] : []}
      onValueChange={(e) => onChange(e.value[0] ?? "")}
    >
      <Select.HiddenSelect />
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText placeholder="Select Feature/Module" />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content>
            {featureModules.items.map((item) => (
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
