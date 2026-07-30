import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDate,
  isSameDay,
  startOfDay,
} from "date-fns";
import type { OneTimeExpense, RecurringExpense } from "./types";

export const DAYS_PER_ROW = 5;
export const DAY_RADIUS = 7;

export function dateKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function calendarDays(from: Date = new Date()): Date[] {
  const today = startOfDay(from);
  return eachDayOfInterval({
    start: addDays(today, -DAY_RADIUS),
    end: addDays(today, DAY_RADIUS),
  });
}

export function dueDateInMonth(
  year: number,
  monthIndex: number,
  dueDay: number,
): Date {
  const last = getDate(endOfMonth(new Date(year, monthIndex, 1)));
  const day = Math.min(Math.max(1, dueDay), last);
  return startOfDay(new Date(year, monthIndex, day));
}

export type DayBill = {
  id: string;
  name: string;
  amount: number;
  /** One-time expenses can be removed from the day card; monthly cannot. */
  removable: boolean;
};

export function billsOnDay(
  day: Date,
  monthly: RecurringExpense[],
  oneTime: OneTimeExpense[],
): DayBill[] {
  const key = dateKey(day);
  const recurring = monthly
    .filter((e) => {
      if (!e.name.trim() || e.amount <= 0) return false;
      const due = dueDateInMonth(day.getFullYear(), day.getMonth(), e.dueDay);
      return isSameDay(due, day);
    })
    .map((e) => ({
      id: e.id,
      name: e.name,
      amount: e.amount,
      removable: false,
    }));

  const once = oneTime
    .filter((e) => e.dateKey === key && e.name.trim() && e.amount > 0)
    .map((e) => ({
      id: e.id,
      name: e.name,
      amount: e.amount,
      removable: true,
    }));

  return [...recurring, ...once];
}

export type BillWithShortfall = DayBill & { shortfall: number };

export function billsWithShortfall(
  bills: DayBill[],
  openingBalance: number,
): BillWithShortfall[] {
  let available = openingBalance;
  return bills.map((bill) => {
    const shortfall = Math.max(0, bill.amount - Math.max(0, available));
    available -= bill.amount;
    return { ...bill, shortfall };
  });
}

export function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

export function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}
