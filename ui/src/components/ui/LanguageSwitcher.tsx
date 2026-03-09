import { useTranslation } from "react-i18next";
import { Select, createListCollection, Portal } from "@chakra-ui/react";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const languages = createListCollection({
    items: [
      { label: "English", value: "en" },
      { label: "Français", value: "fr" },
    ],
  });

  return (
    <Select.Root
      collection={languages}
      value={[i18n.language]}
      onValueChange={(e) => i18n.changeLanguage(e.value[0] ?? "en")}
    >
      <Select.HiddenSelect />
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText placeholder="Select language" />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content>
            {languages.items.map((lang) => (
              <Select.Item item={lang} key={lang.value}>
                {lang.label}
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );
}