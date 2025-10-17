import { createListCollection, Portal, Select } from "@chakra-ui/react";

export type SelectTestKindProps = {
  onChange: (value: string) => void;
  value?: string;
};

const testKinds = createListCollection({
  items: [
    {
      label: "General",
      value: "general",
    },
    {
      label: "Adhoc",
      value: "adhoc",
    },
    {
      label: "Triage",
      value: "triage",
    },
    {
      label: "Integration",
      value: "integration",
    },
    {
      label: "User acceptance",
      value: "user_acceptance",
    },
    {
      label: "Regression",
      value: "regression",
    },
    {
      label: "Security",
      value: "security",
    },
    {
      label: "User interface",
      value: "user_interface",
    },
    {
      label: "Scenario",
      value: "scenario",
    },
  ],
});

export default function SelectTestKind({ onChange, value }: SelectTestKindProps) {
  return (
    <Select.Root
      collection={testKinds}
      value={value ? [value] : []}
      onValueChange={(e) => onChange(e.value[0] ?? "")}
    >
      <Select.HiddenSelect />
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText placeholder="Select Test Kind" />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content>
            {testKinds.items.map((test) => (
              <Select.Item item={test} key={test.value}>
                {test.label}
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );
}

