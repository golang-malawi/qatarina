import { CountryDropdown } from "@/components/form/CountryDropdown";

export const CountryField = ({ value, onChange, onBlur: _onBlur }: {
  value: unknown;
  onChange: (val: unknown) => void;
  onBlur: () => void;
}) => (
  <CountryDropdown value={value as string} onChange={onChange} />
)