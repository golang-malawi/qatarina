export type DateValue = string | number | Date | null | undefined;

type FormatDateOptions = {
  fallback?: string;
  locale?: Intl.LocalesArgument;
  options?: Intl.DateTimeFormatOptions;
};

const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};

const DEFAULT_DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
};

function toValidDate(value: DateValue): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatHumanDate(
  value: DateValue,
  { fallback = "Not set", locale, options = DEFAULT_DATE_OPTIONS }: FormatDateOptions = {}
) {
  const date = toValidDate(value);
  if (!date) return fallback;
  return date.toLocaleDateString(locale, options);
}

export function formatHumanDateTime(
  value: DateValue,
  {
    fallback = "Not set",
    locale,
    options = DEFAULT_DATE_TIME_OPTIONS,
  }: FormatDateOptions = {}
) {
  const date = toValidDate(value);
  if (!date) return fallback;
  return date.toLocaleString(locale, options);
}
