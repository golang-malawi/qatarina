import {
  Select,
  createListCollection,
  Field,
  Portal,
} from "@chakra-ui/react";

interface SelectFeatureModuleTypeProps {
  value: string;
  onChange: (value: string) => void;
}

const typeOptions = createListCollection({
  items: [
    { label: "Feature", value: "feature" },
    { label: "Component", value: "component" },
    { label: "Module", value: "module" },
  ],
});

export default function SelectFeatureModuleType({
  value,
  onChange,
}: SelectFeatureModuleTypeProps) {
  return (
    <Field.Root>
      <Field.Label>Type</Field.Label>
      <Select.Root
        collection={typeOptions}
        value={[value]}
        onValueChange={(e) => onChange(e.value[0] ?? "")}
      >
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger>
            <Select.ValueText placeholder="Select Type" />
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.Indicator />
            <Select.ClearTrigger />
          </Select.IndicatorGroup>
        </Select.Control>
        <Portal>
          <Select.Positioner>
            <Select.Content>
              {typeOptions.items.map((item) => (
                <Select.Item key={item.value} item={item}>
                  {item.label}
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
      <Field.HelperText>
        Choose whether it's a Feature, Component, or Module
      </Field.HelperText>
    </Field.Root>
  );
}
