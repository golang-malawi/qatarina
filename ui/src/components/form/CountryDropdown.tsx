import {
  Select,
  createListCollection,
  Field,
  Portal,
} from "@chakra-ui/react";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import { useTranslation } from "react-i18next";

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
  const {t} = useTranslation();

  return (
    <Field.Root>
      <Field.Label>{t("country")}</Field.Label>
      <Select.Root
        collection={countryOptions}
        value={value ? [value] : []}
        onValueChange={(e) => {
          const code = e.value[0];
          onChange(code);
        }}
      >
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger>
            <Select.ValueText placeholder={t("select_country")} />
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
      <Field.HelperText>{t("country_helper")}</Field.HelperText>
    </Field.Root>
  );
}