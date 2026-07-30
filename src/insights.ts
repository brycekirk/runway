import {
  addDays,
  differenceInCalendarDays,
  format,
  isBefore,
  startOfDay,
} from "date-fns";
import { CONTROLLABLE_BENCHMARKS } from "./cohort";
import {
  billsOnDay,
  billsWithShortfall,
  calendarDays,
  dateKey,
  DAY_RADIUS,
  formatMoney,
} from "./dates";
import type { OneTimeExpense, RecurringExpense } from "./types";

export type InsightTone = "urgent" | "action" | "peer" | "ok";

export type Insight = {
  id: string;
  /** Lower = higher priority (PM hierarchy). */
  priority: number;
  tone: InsightTone;
  title: string;
  body: string;
  detail?: string;
};

export type DayProjection = {
  day: Date;
  key: string;
  earned: number;
  bills: ReturnType<typeof billsWithShortfall>;
  opening: number;
  closing: number;
  isPast: boolean;
  isToday: boolean;
};

type Input = {
  startingBalance: number;
  monthlyExpenses: RecurringExpense[];
  oneTimeExpenses: OneTimeExpense[];
  earnings: Record<string, number>;
};

function matchBenchmark(expenseName: string) {
  const lower = expenseName.toLowerCase();
  return CONTROLLABLE_BENCHMARKS.find((b) =>
    b.nameHints.some((hint) => lower.includes(hint)),
  );
}

/** Average earned on past days that have a logged amount (incl. $0). */
export function recentDailyAverage(
  earnings: Record<string, number>,
  from: Date = new Date(),
): number {
  const today = startOfDay(from);
  const values: number[] = [];
  for (let i = DAY_RADIUS; i >= 1; i--) {
    const key = dateKey(addDays(today, -i));
    if (key in earnings) values.push(earnings[key] ?? 0);
  }
  if (values.length === 0) return 0;
  return values.reduce((s, n) => s + n, 0) / values.length;
}

/**
 * Project the calendar window.
 * Blank future days use `assumedDailyEarn` (default 0 = conservative).
 * Matches app semantics: bills are checked against opening balance before earn.
 */
export function projectDays(
  input: Input & { assumedDailyEarn?: number },
  from: Date = new Date(),
): DayProjection[] {
  const today = startOfDay(from);
  const assumed = input.assumedDailyEarn ?? 0;
  const days = calendarDays(from);
  let running = input.startingBalance;

  return days.map((day) => {
    const key = dateKey(day);
    const isPast = isBefore(day, today);
    const isToday = day.getTime() === today.getTime();
    const logged = input.earnings[key];
    const earned =
      logged !== undefined ? logged : isPast || isToday ? 0 : assumed;
    const bills = billsOnDay(
      day,
      input.monthlyExpenses,
      input.oneTimeExpenses,
    );
    const opening = running;
    const withShort = billsWithShortfall(bills, opening);
    const billTotal = bills.reduce((s, b) => s + b.amount, 0);
    running = opening + earned - billTotal;
    return {
      day,
      key,
      earned,
      bills: withShort,
      opening,
      closing: running,
      isPast,
      isToday,
    };
  });
}

function upcomingBillInsight(days: DayProjection[]): Insight | null {
  const upcoming = days.filter((d) => !d.isPast && d.bills.length > 0);
  if (upcoming.length === 0) return null;

  const next = upcoming[0];
  const total = next.bills.reduce((s, b) => s + b.amount, 0);
  const names = next.bills.map((b) => b.name).join(", ");
  const daysAway = differenceInCalendarDays(next.day, startOfDay(new Date()));
  const when =
    daysAway === 0
      ? "today"
      : daysAway === 1
        ? "tomorrow"
        : `in ${daysAway} days`;

  const short = next.bills.reduce((s, b) => s + b.shortfall, 0);
  if (short > 0) {
    return {
      id: `bill-short-${next.key}`,
      priority: 1,
      tone: "urgent",
      title: `${names} ${when} — you're short`,
      body: `You need ${formatMoney(total)} by ${format(next.day, "MMM d")}, but projected cash covers only ${formatMoney(Math.max(0, total - short))}. Gap: ${formatMoney(short)}.`,
      detail: "Cover the next obligation before anything else.",
    };
  }

  if (daysAway <= 5) {
    return {
      id: `bill-soon-${next.key}`,
      priority: 2,
      tone: "action",
      title: `${names} coming ${when}`,
      body: `Make sure ${formatMoney(total)} is in the bank by ${format(next.day, "MMM d")}. You're currently on track to cover it.`,
    };
  }

  return null;
}

/**
 * Minimum flat daily earn (applied to today + blank future days) that clears
 * shortfalls. Logged amounts are kept as-is.
 */
function dailyTargetInsight(
  days: DayProjection[],
  avgEarn: number,
  input: Input,
  from: Date,
): Insight | null {
  const todayIdx = days.findIndex((d) => d.isToday);
  if (todayIdx < 0) return null;

  const openingToday = days[todayIdx].opening;
  const remainingKeys = days.slice(todayIdx).map((d) => d.key);

  function survives(daily: number): { ok: boolean; gap?: number } {
    let bal = openingToday;
    for (const key of remainingKeys) {
      const day = days.find((d) => d.key === key)!;
      const opening = bal;
      const billTotal = day.bills.reduce((s, b) => s + b.amount, 0);
      const logged = input.earnings[key];
      const earn =
        logged !== undefined && logged > 0
          ? logged
          : daily;

      if (billTotal > opening) {
        return { ok: false, gap: billTotal - opening };
      }
      bal = opening + earn - billTotal;
    }
    return { ok: true };
  }

  const baseline = survives(0);
  if (baseline.ok) {
    if (avgEarn > 0) {
      return {
        id: "on-track",
        priority: 5,
        tone: "ok",
        title: "On track for this window",
        body: `No shortfalls in the next ${DAY_RADIUS} days at your current pace. Recent average: ${formatMoney(avgEarn)}/day logged.`,
      };
    }
    return {
      id: "on-track-quiet",
      priority: 5,
      tone: "ok",
      title: "Bills in this window look covered",
      body: "Keep logging what you earn each day so the runway stays accurate.",
    };
  }

  let lo = 0;
  let hi = 800;
  for (let i = 0; i < 28; i++) {
    const mid = (lo + hi) / 2;
    if (survives(mid).ok) hi = mid;
    else lo = mid;
  }
  const needed = Math.ceil(hi);
  const extra = Math.max(0, needed - Math.round(avgEarn));

  // Re-check with recent average as assumed earn to phrase the message.
  const withAvg = projectDays(
    { ...input, assumedDailyEarn: avgEarn },
    from,
  );
  const stillShort = withAvg.some(
    (d) => !d.isPast && d.bills.some((b) => b.shortfall > 0),
  );

  if (avgEarn > 0 && !stillShort) {
    return {
      id: "maintain-pace",
      priority: 3,
      tone: "action",
      title: "Keep your recent earning pace",
      body: `Averaging about ${formatMoney(Math.round(avgEarn))}/day from here clears upcoming bills. Stay near what you’ve been logging.`,
    };
  }

  return {
    id: "daily-target",
    priority: 3,
    tone: "action",
    title:
      extra > 0 && avgEarn > 0
        ? `Make about ${formatMoney(extra)} more per day`
        : `Aim for ${formatMoney(needed)}/day`,
    body:
      extra > 0 && avgEarn > 0
        ? `At your recent ${formatMoney(Math.round(avgEarn))}/day average, you’d still miss a bill. Roughly ${formatMoney(needed)}/day through the next ${DAY_RADIUS} days keeps cash flow positive.`
        : `Logging about ${formatMoney(needed)} each day for the rest of this window covers what’s coming due.`,
    detail: baseline.gap
      ? `Next gap looks like ${formatMoney(baseline.gap)} if earnings stop.`
      : undefined,
  };
}

function peerInsights(monthly: RecurringExpense[]): Insight[] {
  const out: Insight[] = [];

  for (const expense of monthly) {
    if (!expense.name.trim() || expense.amount <= 0) continue;
    const bench = matchBenchmark(expense.name);
    if (!bench) continue;

    const diff = expense.amount - bench.median;
    if (Math.abs(diff) < 5 && Math.abs(diff) / bench.median < 0.1) continue;

    if (diff > 0) {
      out.push({
        id: `peer-${expense.id}`,
        priority: 4,
        tone: "peer",
        title: `Your ${bench.label} runs high vs peers`,
        body: `You’re paying ${formatMoney(expense.amount)}/mo — about ${formatMoney(diff)} above the ${bench.region} median (${formatMoney(bench.median)}). Switching toward the median frees ~${formatMoney(diff)}/mo for your bill buffer.`,
        detail: `Based on ${bench.sampleSize} ${bench.region} workers · controllable spend only`,
      });
    } else {
      out.push({
        id: `peer-win-${expense.id}`,
        priority: 6,
        tone: "peer",
        title: `${bench.label} looks lean`,
        body: `At ${formatMoney(expense.amount)}/mo you’re about ${formatMoney(Math.abs(diff))} under the ${bench.region} median. That gap is already working as buffer toward bigger bills.`,
        detail: `Based on ${bench.sampleSize} ${bench.region} workers`,
      });
    }
  }

  return out;
}

function bufferDaysInsight(days: DayProjection[]): Insight | null {
  const today = days.find((d) => d.isToday);
  if (!today) return null;

  let bal = today.closing;
  let counted = 0;
  for (const d of days) {
    if (d.isPast || d.isToday) continue;
    const bills = d.bills.reduce((s, b) => s + b.amount, 0);
    bal -= bills;
    counted += 1;
    if (bal < 0) {
      return {
        id: "buffer-days",
        priority: 3,
        tone: "action",
        title: `${counted} buffer day${counted === 1 ? "" : "s"} if earnings stop`,
        body: `With cash after today and no new pay, you’d run short around ${format(d.day, "MMM d")}. Buffer days are the north-star metric for volatile income.`,
      };
    }
  }

  if (counted > 0 && bal >= 0) {
    return {
      id: "buffer-ok",
      priority: 6,
      tone: "ok",
      title: `Buffer covers the next ${counted} days`,
      body: "Even with no more earnings this window, known bills still clear. Logging pay keeps this honest.",
    };
  }
  return null;
}

export function buildInsights(input: Input, from: Date = new Date()): Insight[] {
  const avg = recentDailyAverage(input.earnings, from);
  const days = projectDays({ ...input, assumedDailyEarn: 0 }, from);

  const insights: Insight[] = [];

  const bill = upcomingBillInsight(days);
  if (bill) insights.push(bill);

  const target = dailyTargetInsight(days, avg, input, from);
  if (target) insights.push(target);

  const buffer = bufferDaysInsight(days);
  if (buffer && !(buffer.tone === "ok" && target?.tone === "ok")) {
    insights.push(buffer);
  }

  insights.push(...peerInsights(input.monthlyExpenses));

  const seen = new Set<string>();
  return insights
    .filter((i) => {
      if (seen.has(i.id)) return false;
      seen.add(i.id);
      return true;
    })
    .sort((a, b) => a.priority - b.priority || a.title.localeCompare(b.title));
}

export function urgentInsightCount(insights: Insight[]): number {
  return insights.filter((i) => i.tone === "urgent").length;
}

/** Top cash-flow insight for the runway header — what a daily earner should act on next. */
export function primaryInsight(insights: Insight[]): Insight | null {
  return (
    insights.find((i) => i.tone === "urgent" || i.tone === "action") ??
    insights[0] ??
    null
  );
}
