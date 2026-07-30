import { format, isToday, startOfDay } from "date-fns";
import { useState } from "react";
import { DayBlock } from "./DayBlock";
import {
  billsOnDay,
  billsWithShortfall,
  calendarDays,
  dateKey,
  formatMoney,
} from "./dates";
import type { OneTimeExpense, RecurringExpense } from "./types";

type Props = {
  startingBalance: number;
  monthlyExpenses: RecurringExpense[];
  oneTimeExpenses: OneTimeExpense[];
  earnings: Record<string, number>;
  insightCount: number;
  urgentCount: number;
  onEarn: (dateKey: string, amount: number) => void;
  onAddOneTimeExpense: (expense: {
    dateKey: string;
    name: string;
    amount: number;
  }) => void;
  onRemoveOneTimeExpense: (id: string) => void;
  onOpenInsights: () => void;
  onOpenSettings: () => void;
};

export function Runway({
  startingBalance,
  monthlyExpenses,
  oneTimeExpenses,
  earnings,
  insightCount,
  urgentCount,
  onEarn,
  onAddOneTimeExpense,
  onRemoveOneTimeExpense,
  onOpenInsights,
  onOpenSettings,
}: Props) {
  const days = calendarDays();
  const todayStart = startOfDay(new Date()).getTime();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  let running = startingBalance;
  let cashToday = startingBalance;
  const dayStates = days.map((day) => {
    const key = dateKey(day);
    const earned = earnings[key] ?? 0;
    const bills = billsOnDay(day, monthlyExpenses, oneTimeExpenses);
    const opening = running;
    const withShort = billsWithShortfall(bills, opening);
    const billTotal = bills.reduce((s, b) => s + b.amount, 0);
    running = opening + earned - billTotal;
    if (day.getTime() <= todayStart) {
      cashToday = running;
    }
    return { day, key, earned, bills: withShort, closingBalance: running };
  });

  const hovered = hoveredKey
    ? dayStates.find((d) => d.key === hoveredKey)
    : null;
  const showHoveredCash = hovered && !isToday(hovered.day);

  return (
    <section className="calendar">
      <header className="calendar__header">
        <h1>Runway Model</h1>
        <div className="calendar__end">
          <p className="calendar__cash">
            <span className="calendar__cash-label">
              {showHoveredCash
                ? `Cash on ${format(hovered.day, "MMM d")}`
                : "Cash Today"}
            </span>
            <strong>
              {formatMoney(
                showHoveredCash ? hovered.closingBalance : cashToday,
              )}
            </strong>
          </p>
          <div className="calendar__help">
            <button
              type="button"
              className="btn btn--icon"
              onClick={() => setHelpOpen((open) => !open)}
              aria-label="How to use Runway Model"
              aria-expanded={helpOpen}
              title="Help"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                <circle
                  cx="12"
                  cy="12"
                  r="9.25"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                />
                <path
                  d="M9.6 9.4c.35-1.15 1.25-1.9 2.5-1.9 1.45 0 2.45.9 2.45 2.15 0 1.2-.7 1.75-1.55 2.2-.75.4-1.05.7-1.05 1.4v.35"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="16.6" r="1" fill="currentColor" />
              </svg>
            </button>
            {helpOpen ? (
              <>
                <button
                  type="button"
                  className="calendar__help-scrim"
                  aria-label="Close help"
                  onClick={() => setHelpOpen(false)}
                />
                <div className="calendar__help-panel" role="dialog" aria-label="About Runway Model">
                  <p>
                    See what you can afford across the next two weeks. Log what
                    you earn each day; bills light up when they’re due and flag
                    if you’re short.
                  </p>
                  <p>
                    Use Insights for bill warnings and daily earn targets. The $
                    button sets bank balance and monthly bills. Add one-off costs
                    with + add expense. Hover a day to check cash on that date.
                  </p>
                </div>
              </>
            ) : null}
          </div>
          <button
            type="button"
            className="btn btn--icon btn--insights"
            onClick={onOpenInsights}
            aria-label={
              urgentCount > 0
                ? `Insights, ${urgentCount} urgent`
                : `Insights, ${insightCount} available`
            }
            title="Insights"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <path
                d="M12 3.5c-3.4 0-6.15 2.55-6.15 5.7 0 2.15 1.2 4.05 3.05 5.05V16.2c0 .55.45 1 1 1h4.2c.55 0 1-.45 1-1v-1.95c1.85-1 3.05-2.9 3.05-5.05C18.15 6.05 15.4 3.5 12 3.5Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
              <path
                d="M10 19.25h4M10.75 21h2.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
            {urgentCount > 0 ? (
              <span className="btn__badge" aria-hidden>
                {urgentCount}
              </span>
            ) : insightCount > 0 ? (
              <span className="btn__dot" aria-hidden />
            ) : null}
          </button>
          <button
            type="button"
            className="btn btn--icon"
            onClick={onOpenSettings}
            aria-label="Expenses and bank"
            title="Expenses & bank"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <circle
                cx="12"
                cy="12"
                r="9.25"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
              />
              <path
                d="M12 7.25v9.5M14.75 9.1c-.45-.7-1.2-1.1-2.75-1.1-1.7 0-2.85.85-2.85 2.05 0 1.15.9 1.75 2.55 2.15l.7.18c1.85.45 2.85 1.15 2.85 2.45 0 1.4-1.25 2.35-3.2 2.35-1.55 0-2.5-.55-3.05-1.4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </header>

      <div className="calendar__grid">
        {dayStates.map((state, i) => (
          <DayBlock
            key={state.key}
            day={state.day}
            bills={state.bills}
            earned={state.earned}
            onEarn={(amount) => onEarn(state.key, amount)}
            onAddExpense={({ name, amount }) =>
              onAddOneTimeExpense({
                dateKey: state.key,
                name,
                amount,
              })
            }
            onRemoveExpense={onRemoveOneTimeExpense}
            onHoverChange={(active) =>
              setHoveredKey(active ? state.key : null)
            }
            index={i}
          />
        ))}
      </div>
    </section>
  );
}
