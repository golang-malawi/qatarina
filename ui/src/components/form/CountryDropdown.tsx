import {
  Select,
  createListCollection,
  Field,
  Portal,
} from "@chakra-ui/react";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

countries.registerLocale(enLocale);

interface CountryDropdownProps {
  value?: string;
  onChange: (value: string) => void;
}

// Generate country options dynamically from i18n-iso-countries
const countryOptions = createListCollection({
  items: Object.entries(
    countries.getNames("en", { select: "official" })
  ).map(([code, name]) => ({
    label: name,
    value: code,
  })),
});

export function CountryDropdown({ value, onChange }: CountryDropdownProps) {
  return (
    <Field.Root>
      <Field.Label>Country</Field.Label>
      <Select.Root
        collection={countryOptions}
        value={
          value 
          ? [countryOptions.items.find(i => i.label === value)?.value ?? ""] 
          : []
        }
        onValueChange={(e) => {
          const code = e.value[0];
          const item = countryOptions.items.find(i => i.value === code);
          onChange(item?.label ?? "");
        }}
      >
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger>
            <Select.ValueText placeholder="Select Country" />
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.Indicator />
            <Select.ClearTrigger />
          </Select.IndicatorGroup>
        </Select.Control>
        <Portal>
          <Select.Positioner>
            <Select.Content>
              {countryOptions.items.map((item) => (
                <Select.Item key={item.value} item={item}>
                  {item.label}
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
      <Field.HelperText>Choose the organization’s country</Field.HelperText>
    </Field.Root>
  );
}