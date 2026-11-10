import type {
  InsightsTestCase,
  InsightsTestPlan,
  InsightsTestRun,
} from "@/services/InsightsService";

// Pure calculations behind the project Insights page. Kept free of React so
// they are easy to reason about and test.

const DAY_MS = 24 * 60 * 60 * 1000;

export type RangeDays = 7 | 30 | 90;

/** Parses RFC 3339 and the backend's "YYYY-MM-DD HH:MM:SS" format. */
export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? null : d;
}

const isExecuted = (r: InsightsTestRun) => r.resultState !== "pending";

function runsBetween(runs: InsightsTestRun[], from: number, to: number) {
  return runs.filter((r) => {
    if (!isExecuted(r)) return false;
    const t = parseDate(r.testedOn)?.getTime();
    return t !== undefined && t >= from && t < to;
  });
}

/** Share of executed runs that passed, or null when nothing was executed. */
export function passRate(runs: InsightsTestRun[]): number | null {
  const executed = runs.filter(isExecuted);
  if (executed.length === 0) return null;
  return executed.filter((r) => r.resultState === "passed").length / executed.length;
}

// ---- 1. Health at a glance --------------------------------------------------

export type HealthSummary = {
  passRate: number | null;
  /** Change in pass rate versus the previous period, in percentage points. */
  passRateChange: number | null;
  executedInPeriod: number;
  failing: number;
  blocked: number;
  neverExecuted: number;
  activePlans: number;
  overduePlans: number;
};

export function healthSummary(
  cases: InsightsTestCase[],
  plans: InsightsTestPlan[],
  runs: InsightsTestRun[],
  rangeDays: RangeDays,
  now: number = Date.now()
): HealthSummary {
  const rangeMs = rangeDays * DAY_MS;
  const current = runsBetween(runs, now - rangeMs, now + 1);
  const previous = runsBetween(runs, now - 2 * rangeMs, now - rangeMs);

  const rate = passRate(current);
  const prevRate = passRate(previous);

  return {
    passRate: rate,
    passRateChange: rate !== null && prevRate !== null ? (rate - prevRate) * 100 : null,
    executedInPeriod: current.length,
    failing: runs.filter((r) => r.resultState === "failed").length,
    blocked: runs.filter((r) => r.resultState === "blocked").length,
    neverExecuted: neverExecutedCases(cases, runs).length,
    activePlans: plans.filter((p) => !p.isComplete).length,
    overduePlans: plans.filter((p) => planStatus(p, now) === "overdue").length,
  };
}

// ---- 2. Results over time ---------------------------------------------------

export type TrendBucket = {
  label: string;
  passed: number;
  failed: number;
  blocked: number;
};

/** Daily buckets for 7/30 day ranges, weekly buckets for 90 days. */
export function resultsOverTime(
  runs: InsightsTestRun[],
  rangeDays: RangeDays,
  now: number = Date.now(),
  locale?: string
): TrendBucket[] {
  const bucketDays = rangeDays > 30 ? 7 : 1;
  const bucketMs = bucketDays * DAY_MS;
  const count = Math.ceil(rangeDays / bucketDays);

  // Align the last bucket to end at the end of today.
  const endOfToday = new Date(now);
  endOfToday.setHours(24, 0, 0, 0);
  const end = endOfToday.getTime();
  const start = end - count * bucketMs;

  const buckets: TrendBucket[] = Array.from({ length: count }, (_, i) => ({
    label: new Date(start + i * bucketMs).toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
    }),
    passed: 0,
    failed: 0,
    blocked: 0,
  }));

  for (const run of runsBetween(runs, start, end)) {
    const t = parseDate(run.testedOn)!.getTime();
    const index = Math.min(count - 1, Math.floor((t - start) / bucketMs));
    const state = run.resultState as "passed" | "failed" | "blocked";
    buckets[index][state] += 1;
  }
  return buckets;
}

// ---- 4. Test plan comparison ------------------------------------------------

export type PlanStatus = "complete" | "overdue" | "active";

export function planStatus(plan: InsightsTestPlan, now: number = Date.now()): PlanStatus {
  if (plan.isComplete) return "complete";
  const end = parseDate(plan.scheduledEndAt);
  if (end && end.getTime() < now) return "overdue";
  return "active";
}

export type PlanRow = {
  plan: InsightsTestPlan;
  status: PlanStatus;
  /** Share of the plan's runs that have a result, 0..1. */
  progress: number;
  passRate: number | null;
};

const STATUS_ORDER: Record<PlanStatus, number> = { overdue: 0, active: 1, complete: 2 };

export function planComparison(
  plans: InsightsTestPlan[],
  now: number = Date.now()
): PlanRow[] {
  return plans
    .map((plan) => {
      const executed = plan.passedCount + plan.failedCount;
      const total = executed + plan.pendingCount;
      return {
        plan,
        status: planStatus(plan, now),
        progress: total === 0 ? 0 : executed / total,
        passRate: executed === 0 ? null : plan.passedCount / executed,
      };
    })
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
}

// ---- 5. Coverage gaps -------------------------------------------------------

export function neverExecutedCases(
  cases: InsightsTestCase[],
  runs: InsightsTestRun[]
): InsightsTestCase[] {
  const executed = new Set(runs.filter(isExecuted).map((r) => r.testCaseId));
  return cases.filter((c) => !c.isDraft && !executed.has(c.id));
}

export type ModuleRow = {
  /** null means the test cases have no feature/module set. */
  module: string | null;
  testCases: number;
  executedRuns: number;
  neverExecuted: number;
  passRate: number | null;
};

export function coverageByModule(
  cases: InsightsTestCase[],
  runs: InsightsTestRun[]
): ModuleRow[] {
  const moduleOf = new Map(cases.map((c) => [c.id, c.featureOrModule?.trim() || null]));
  const never = new Set(neverExecutedCases(cases, runs).map((c) => c.id));

  const rows = new Map<string | null, { cases: number; never: number; runs: InsightsTestRun[] }>();
  const rowFor = (m: string | null) => {
    let row = rows.get(m);
    if (!row) {
      row = { cases: 0, never: 0, runs: [] };
      rows.set(m, row);
    }
    return row;
  };

  for (const c of cases) {
    const row = rowFor(moduleOf.get(c.id) ?? null);
    row.cases += 1;
    if (never.has(c.id)) row.never += 1;
  }
  for (const r of runs) {
    if (!isExecuted(r) || !moduleOf.has(r.testCaseId)) continue;
    rowFor(moduleOf.get(r.testCaseId) ?? null).runs.push(r);
  }

  return [...rows.entries()]
    .map(([module, row]) => ({
      module,
      testCases: row.cases,
      executedRuns: row.runs.length,
      neverExecuted: row.never,
      passRate: passRate(row.runs),
    }))
    .sort((a, b) => {
      // Weakest areas first: lowest pass rate, then most untested cases.
      const ar = a.passRate ?? -1;
      const br = b.passRate ?? -1;
      return ar !== br ? ar - br : b.neverExecuted - a.neverExecuted;
    });
}

export function formatPercent(value: number | null, fallback = "—"): string {
  return value === null ? fallback : `${Math.round(value * 100)}%`;
}
