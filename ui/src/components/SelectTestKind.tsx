import { createListCollection } from "@chakra-ui/react";
import {
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select";

export type SelectTestKindProps = {
  onChange: (value: string) => void;
};

const testKinds = createListCollection({
  items: [
    { label: "general", value: "general" },
    { label: "adhoc", value: "adhoc" },
    { label: "triage", value: "triage" },
    { label: "integration", value: "integration" },
    { label: "user_acceptance", value: "user_acceptance" },
    { label: "regression", value: "regression" },
    { label: "security", value: "security" },
    { label: "user_interface", value: "user_interface" },
    { label: "scenario", value: "scenario" },
  ],
});

export default function SelectTestKind({ onChange }: SelectTestKindProps) {
  return (
    <SelectRoot
      collection={testKinds}
      onValueChange={(e) => onChange(e.value?.[0])}
    >
      <SelectLabel>Test Kind</SelectLabel>
      <SelectTrigger>
        <SelectValueText placeholder="Select Test Kind" />
      </SelectTrigger>
      <SelectContent>
        {testKinds.items.map((kind) => (
          <SelectItem item={kind} key={kind.value}>
            {kind.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  );
}
