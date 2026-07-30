import { useEffect, useId, useState, type FormEvent } from "react";
import type { RecurringExpense } from "./types";
import { formatMoney } from "./dates";

type Props = {
  open: boolean;
  startingBalance: number;
  expenses: RecurringExpense[];
  onClose: () => void;
  onSave: (payload: {
    startingBalance: number;
    expenses: RecurringExpense[];
  }) => void;
};

function newExpense(): RecurringExpense {
  return {
    id: crypto.randomUUID(),
    name: "",
    amount: 0,
    dueDay: 1,
  };
}

export function SettingsPanel({
  open,
  startingBalance,
  expenses,
  onClose,
  onSave,
}: Props) {
  const formId = useId();
  const [balance, setBalance] = useState(String(startingBalance || ""));
  const [rows, setRows] = useState<RecurringExpense[]>(() =>
    expenses.length ? expenses : [newExpense()],
  );

  useEffect(() => {
    if (!open) return;
    setBalance(String(startingBalance || ""));
    setRows(
      expenses.length ? expenses.map((e) => ({ ...e })) : [newExpense()],
    );
  }, [open, startingBalance, expenses]);

  if (!open) return null;

  function updateRow(id: string, patch: Partial<RecurringExpense>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nextExpenses = rows
      .map((r) => ({
        ...r,
        name: r.name.trim(),
        amount: Number(r.amount) || 0,
        dueDay: Math.min(31, Math.max(1, Math.round(Number(r.dueDay) || 1))),
      }))
      .filter((r) => r.name.length > 0 && r.amount > 0);

    onSave({
      startingBalance: Number(balance) || 0,
      expenses: nextExpenses,
    });
    onClose();
  }

  const monthly = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  return (
    <div
      className="settings"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${formId}-title`}
    >
      <button
        type="button"
        className="settings__backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="settings__panel">
        <header className="settings__head">
          <h2 id={`${formId}-title`}>Money &amp; expenses</h2>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Close
          </button>
        </header>

        <form className="settings__form" onSubmit={handleSubmit}>
          <label className="field" htmlFor={`${formId}-balance`}>
            <span className="field__label">Starting money in bank</span>
            <span className="field__wrap">
              <span className="field__prefix">$</span>
              <input
                id={`${formId}-balance`}
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
              />
            </span>
          </label>

          <div className="settings__section-label">Monthly expenses</div>
          <div className="settings__table-head" aria-hidden>
            <span>Name</span>
            <span>Amount</span>
            <span>Withdrawal Day</span>
          </div>
          <ul className="settings__rows">
            {rows.map((row) => (
              <li key={row.id} className="settings__row">
                <input
                  type="text"
                  placeholder="Name"
                  value={row.name}
                  onChange={(e) => updateRow(row.id, { name: e.target.value })}
                  aria-label="Name"
                />
                <span className="field__wrap field__wrap--amount">
                  <span className="field__prefix">$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={row.amount || ""}
                    onChange={(e) =>
                      updateRow(row.id, { amount: Number(e.target.value) || 0 })
                    }
                    aria-label="Amount"
                  />
                </span>
                <input
                  className="settings__day"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={31}
                  value={row.dueDay}
                  onChange={(e) =>
                    updateRow(row.id, {
                      dueDay: Math.min(
                        31,
                        Math.max(1, Number(e.target.value) || 1),
                      ),
                    })
                  }
                  aria-label="Withdrawal day"
                />
              </li>
            ))}
          </ul>

          <div className="settings__actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setRows((prev) => [...prev, newExpense()])}
            >
              Add expense
            </button>
            <span className="settings__total">
              Monthly · {formatMoney(monthly)}
            </span>
          </div>

          <button type="submit" className="btn btn--primary">
            Save
          </button>
        </form>
      </div>
    </div>
  );
}
