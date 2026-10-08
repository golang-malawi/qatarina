// Mirrors TestLink's importance/urgency levels (1=LOW, 2=MEDIUM, 3=HIGH)
export const PRIORITY_LEVELS = ["low", "medium", "high"] as const;

export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

export const DEFAULT_PRIORITY: PriorityLevel = "medium";

export const PRIORITY_OPTIONS = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  high: "red",
  medium: "orange",
  low: "gray",
};

export function normalizePriority(value?: string | null): PriorityLevel {
  return PRIORITY_LEVELS.includes(value as PriorityLevel)
    ? (value as PriorityLevel)
    : DEFAULT_PRIORITY;
}
