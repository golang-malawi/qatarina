import { NativeSelect } from "@chakra-ui/react";

// A compact dropdown filter for toolbars. The empty value stands for "all".
export function FilterSelect({
  label,
  allLabel,
  value,
  options,
  onChange,
}: {
  label: string;
  allLabel: string;
  value: string;
  options: { value?: string; label?: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <NativeSelect.Root size="sm" w="auto" minW="36" maxW="56">
      <NativeSelect.Field aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{allLabel}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </NativeSelect.Field>
      <NativeSelect.Indicator />
    </NativeSelect.Root>
  );
}
