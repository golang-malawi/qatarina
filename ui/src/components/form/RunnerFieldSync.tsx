import SelectRunner from "./SelectRunner";
import { useEffect } from "react";

interface RunnerFieldSyncProps {
  value: string;
  onChange: (val: string) => void;
  onRunnerChange: (runner: string) => void;
  supportedRunners?: string[];
}

export function RunnerFieldSync({
  value,
  onChange,
  onRunnerChange,
  supportedRunners,
}: RunnerFieldSyncProps) {
  // Sync selectedRunner whenever the form value changes
  useEffect(() => {
    if (value) {
      onRunnerChange(value);
    }
  }, [value, onRunnerChange]);

  return (
    <SelectRunner
      value={value || ""}
      onChange={(val) => {
        onChange(val);
        onRunnerChange(val);
      }}
      supportedRunners={supportedRunners}
    />
  );
}