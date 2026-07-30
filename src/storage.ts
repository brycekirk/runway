import {
  SAMPLE_EXPENSES,
  SAMPLE_STARTING_BALANCE,
  seedPastEarnings,
} from "./seed";
import type { OneTimeExpense, RecurringExpense } from "./types";

const KEY = "runway-app-v2";

export type PersistedState = {
  startingBalance: number;
  monthlyExpenses: RecurringExpense[];
  oneTimeExpenses: OneTimeExpense[];
  earnings: Record<string, number>;
};

function defaults(): PersistedState {
  return {
    startingBalance: SAMPLE_STARTING_BALANCE,
    monthlyExpenses: SAMPLE_EXPENSES,
    oneTimeExpenses: [],
    earnings: seedPastEarnings(),
  };
}

export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    const base = defaults();
    return {
      startingBalance:
        typeof parsed.startingBalance === "number"
          ? parsed.startingBalance
          : base.startingBalance,
      monthlyExpenses: Array.isArray(parsed.monthlyExpenses)
        ? parsed.monthlyExpenses
        : base.monthlyExpenses,
      oneTimeExpenses: Array.isArray(parsed.oneTimeExpenses)
        ? parsed.oneTimeExpenses
        : base.oneTimeExpenses,
      earnings:
        parsed.earnings && typeof parsed.earnings === "object"
          ? parsed.earnings
          : base.earnings,
    };
  } catch {
    return defaults();
  }
}

export function saveState(state: PersistedState): void {
  localStorage.setItem(KEY, JSON.stringify(state));
}
