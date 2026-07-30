import { addDays, startOfDay } from "date-fns";
import { dateKey, DAY_RADIUS } from "./dates";
import type { RecurringExpense } from "./types";

/**
 * W-0001 daily net pay from daily_earnings.csv (2026-06-20 → 2026-06-29).
 * Trailing slice maps onto the past DAY_RADIUS calendar days.
 */
const PAST_EARNINGS_SAMPLE = [
  145.44, 0, 211.21, 159.57, 104.95, 0, 183.39, 0, 0, 142.22,
];

/** W-0001 recurring obligations from recurring_obligations.csv */
export const SAMPLE_EXPENSES: RecurringExpense[] = [
  { id: "rent", name: "Rent", amount: 2056, dueDay: 1 },
  { id: "phone", name: "Phone", amount: 66, dueDay: 1 },
  { id: "utilities", name: "Utilities", amount: 154, dueDay: 5 },
  { id: "streaming", name: "Streaming", amount: 9.99, dueDay: 22 },
];

/** Default bank balance — low enough that rent shortfall is visible. */
export const SAMPLE_STARTING_BALANCE = 1200;

export function seedPastEarnings(from: Date = new Date()): Record<string, number> {
  const today = startOfDay(from);
  const slice = PAST_EARNINGS_SAMPLE.slice(-DAY_RADIUS);
  const earnings: Record<string, number> = {};
  slice.forEach((amount, i) => {
    const day = addDays(today, -DAY_RADIUS + i);
    if (amount > 0) earnings[dateKey(day)] = amount;
  });
  return earnings;
}
