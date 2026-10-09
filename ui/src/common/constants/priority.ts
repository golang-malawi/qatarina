// Mirrors importance/urgency levels (1=LOW, 2=MEDIUM, 3=HIGH), plus URGENT
export const PRIORITY_LEVELS = ["low", "medium", "high", "urgent"] as const;

export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

export const DEFAULT_PRIORITY: PriorityLevel = "medium";

export const PRIORITY_OPTIONS = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

// Urgent uses a solid badge so it stands out from the subtle high badge
export const PRIORITY_STYLES: Record<
  PriorityLevel,
  { colorPalette: string; variant: "subtle" | "solid" }
> = {
  urgent: { colorPalette: "red", variant: "solid" },
  high: { colorPalette: "orange", variant: "subtle" },
  medium: { colorPalette: "yellow", variant: "subtle" },
  low: { colorPalette: "gray", variant: "subtle" },
};

export function normalizePriority(value?: string | null): PriorityLevel {
  return PRIORITY_LEVELS.includes(value as PriorityLevel)
    ? (value as PriorityLevel)
    : DEFAULT_PRIORITY;
}
