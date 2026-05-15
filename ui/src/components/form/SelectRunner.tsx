import { createListCollection, Portal, Select } from "@chakra-ui/react";

export type SelectRunnerProps = {
  onChange: (value: string) => void;
  value?: string;
};

const runners = createListCollection({
  items: [
    { label: "Basi", value: "basi" },
    { label: "Playwright", value: "playwright" },
    { label: "Cypress", value: "cypress" },
    { label: "BrowserUse", value: "browseruse" },
  ],
});

export default function SelectRunner({ onChange, value }: SelectRunnerProps) {
  return (
    <Select.Root
      collection={runners}
      value={value ? [value] : []}
      onValueChange={(e) => onChange(e.value[0] ?? "")}
    >
      <Select.HiddenSelect />
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText placeholder="Select Runner" />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content>
            {runners.items.map((runner) => (
              <Select.Item item={runner} key={runner.value}>
                {runner.label}
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );
}
