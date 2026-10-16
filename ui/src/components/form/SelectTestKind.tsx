import { createListCollection, Portal, Select } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

export type SelectTestKindProps = {
  onChange: (value: string) => void;
  value?: string;
};

export default function SelectTestKind({ onChange, value }: SelectTestKindProps) {
  const { t } = useTranslation();

  const testKinds = createListCollection({
    items: [
      { label: t("test_cases.kind.general"), value: "general" },
      { label: t("test_cases.kind.adhoc"), value: "adhoc" },
      { label: t("test_cases.kind.triage"), value: "triage" },
      { label: t("test_cases.kind.integration"), value: "integration" },
      { label: t("test_cases.kind.user_acceptance"), value: "user_acceptance" },
      { label: t("test_cases.kind.regression"), value: "regression" },
      { label: t("test_cases.kind.security"), value: "security" },
      { label: t("test_cases.kind.user_interface"), value: "user_interface" },
      { label: t("test_cases.kind.scenario"), value: "scenario" },
    ],
  });

  return (
    <Select.Root
      collection={testKinds}
      value={value ? [value] : []}
      onValueChange={(e) => onChange(e.value[0] ?? "")}
    >
      <Select.HiddenSelect />
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText placeholder={t("test_cases.select_kind_placeholder")} />
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
