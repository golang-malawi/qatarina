import { useCallback, useEffect, useState } from "react";

// Matches a GFM task list item marker, e.g. "- [ ] step", "1. [x] step", "> * [X] step"
export const TASK_LINE = /^(\s*(?:>\s*)*(?:[-*+]|\d+[.)])\s+\[)[ xX](\])/;

/** line number (1-based, as reported by remark) -> checked */
export type ChecklistState = Record<number, boolean>;

/**
 * Returns the markdown with every task item listed in `state` ticked/unticked,
 * so the tester's progress can be stored alongside a test result.
 */
export function applyChecklistState(
  markdown: string,
  state: ChecklistState,
): string {
  const lines = markdown.split("\n");
  for (const [line, checked] of Object.entries(state)) {
    const idx = Number(line) - 1;
    if (lines[idx] === undefined) continue;
    lines[idx] = lines[idx].replace(TASK_LINE, `$1${checked ? "x" : " "}$2`);
  }
  return lines.join("\n");
}

type StoredChecklist = { source: string; checked: ChecklistState };

function readStored(storageKey: string, source: string): ChecklistState {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return {};
    const stored = JSON.parse(raw) as StoredChecklist;
    // Discard saved progress if the test case description has since changed
    return stored.source === source ? stored.checked : {};
  } catch {
    return {};
  }
}

/**
 * Keeps the checked state of a markdown checklist in localStorage so that
 * ticks survive page refreshes without modifying the test case itself.
 */
export function useChecklistState(storageKey: string, source: string) {
  const [checked, setChecked] = useState<ChecklistState>(() =>
    readStored(storageKey, source),
  );

  useEffect(() => {
    setChecked(readStored(storageKey, source));
  }, [storageKey, source]);

  const toggle = useCallback(
    (line: number, value: boolean) => {
      setChecked((prev) => {
        const next = { ...prev, [line]: value };
        try {
          localStorage.setItem(
            storageKey,
            JSON.stringify({ source, checked: next } satisfies StoredChecklist),
          );
        } catch {
          // storage unavailable (private mode / quota) - keep in-memory state only
        }
        return next;
      });
    },
    [storageKey, source],
  );

  const reset = useCallback(() => {
    setChecked({});
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }, [storageKey]);

  return { checked, toggle, reset };
}
