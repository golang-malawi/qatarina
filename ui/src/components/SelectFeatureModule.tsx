import { createListCollection, Portal, Select } from "@chakra-ui/react";

export type SelectFeatureModuleProps = {
  onChange: (value: string) => void;
};

const featureModules = createListCollection({
  items: [
    { label: "Login Feature", value: "login_feature" },
    { label: "User Profile Component", value: "user_profile_component" },
    { label: "Reporting Module", value: "reporting_module" },
    { label: "Payment Gateway Module", value: "payment_gateway_module" },
    { label: "Notification Feature", value: "notification_feature" },
    { label: "Dashboard Component", value: "dashboard_component" },
  ],
});

export default function SelectFeatureModule({
  onChange,
}: SelectFeatureModuleProps) {
  return (
    <Select.Root
      collection={featureModules}
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
