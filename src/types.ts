export type RecurringExpense = {
  id: string;
  name: string;
  amount: number;
  dueDay: number; // 1–31
};

/** One-off expense that applies to a single calendar day only. */
export type OneTimeExpense = {
  id: string;
  dateKey: string; // yyyy-MM-dd
  name: string;
  amount: number;
};

export type DailyEarning = {
  dateKey: string;
  amount: number;
};
