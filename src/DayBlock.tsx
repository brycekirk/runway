import { format, isBefore, isToday, startOfDay } from "date-fns";
import { useId, useState, type FormEvent } from "react";
import type { BillWithShortfall } from "./dates";
import { formatMoney } from "./dates";

type Props = {
  day: Date;
  bills: BillWithShortfall[];
  earned: number;
  onEarn: (amount: number) => void;
  onAddExpense: (expense: { name: string; amount: number }) => void;
  onRemoveExpense: (id: string) => void;
  onHoverChange: (active: boolean) => void;
  index: number;
};

function CheckCircleIcon() {
  return (
    <svg className="expense__icon expense__icon--ok" viewBox="0 0 20 20" aria-hidden>
      <circle cx="10" cy="10" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M6.2 10.2 8.7 12.7 13.8 7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg className="expense__icon expense__icon--short" viewBox="0 0 20 20" aria-hidden>
      <circle cx="10" cy="10" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M7.2 7.2 12.8 12.8 M12.8 7.2 7.2 12.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function DayBlock({
  day,
  bills,
  earned,
  onEarn,
  onAddExpense,
  onRemoveExpense,
  onHoverChange,
  index,
}: Props) {
  const formId = useId();
  const today = isToday(day);
  const past = isBefore(startOfDay(day), startOfDay(new Date())) && !today;
  const hasShortfall = bills.some((b) => b.shortfall > 0);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  function submitExpense(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    const value = Number(amount);
    if (!trimmed || !(value > 0)) return;
    onAddExpense({ name: trimmed, amount: value });
    setName("");
    setAmount("");
    setAdding(false);
  }

  return (
    <article
      className={[
        "day",
        today ? "day--today" : "",
        past ? "day--past" : "",
        hasShortfall && !today ? "day--short" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        animationDelay: `${index * 18}ms`,
        ...(past ? { opacity: 0.6 } : null),
      }}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      <header className="day__head">
        <span className="day__weekday">
          {today ? "Today" : format(day, "EEE")}
        </span>
        <span className="day__num">{format(day, "d")}</span>
      </header>

      {bills.length > 0 ? (
        <div className="day__expenses">
          <ul className="day__bills">
            {bills.map((b) => {
              const covered = b.shortfall <= 0;
              return (
                <li key={b.id} className="expense">
                  <span
                    className="expense__status-icon"
                    title={covered ? "Covered" : "Short"}
                  >
                    {covered ? <CheckCircleIcon /> : <XCircleIcon />}
                  </span>
                  <div className="expense__row">
                    <span className="expense__name">{b.name}</span>
                    <span
                      className={
                        b.removable
                          ? "expense__end expense__end--removable"
                          : "expense__end"
                      }
                    >
                      <span className="expense__amt">
                        −{formatMoney(b.amount)}
                      </span>
                      {b.removable ? (
                        <button
                          type="button"
                          className="expense__remove"
                          onClick={() => onRemoveExpense(b.id)}
                          aria-label={`Remove ${b.name}`}
                        >
                          <svg
                            viewBox="0 0 12 12"
                            width="10"
                            height="10"
                            aria-hidden
                          >
                            <path
                              d="M2 2 10 10 M10 2 2 10"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      ) : null}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
          {hasShortfall ? (
            <p className="day__shortfall">
              Short{" "}
              {formatMoney(
                Math.round(
                  bills.reduce((sum, b) => sum + b.shortfall, 0),
                ),
              )}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="day__spacer" />
      )}

      {adding ? (
        <form className="day__add-form" onSubmit={submitExpense}>
          <input
            id={`${formId}-name`}
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Expense name"
            autoFocus
          />
          <input
            id={`${formId}-amt`}
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="$"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-label="Expense amount"
          />
          <div className="day__add-actions">
            <button type="submit" className="day__add-save">
              Save
            </button>
            <button
              type="button"
              className="day__add-cancel"
              onClick={() => {
                setAdding(false);
                setName("");
                setAmount("");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="day__add-btn"
          onClick={() => setAdding(true)}
        >
          + add expense
        </button>
      )}

      <div className="day__earn">
        <span className="day__earn-wrap">
          <span className="day__earn-prefix">$</span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            placeholder="—"
            value={earned ? Math.round(earned) : ""}
            onChange={(e) =>
              onEarn(Math.round(Number(e.target.value) || 0))
            }
            aria-label={`Earnings for ${format(day, "MMMM d")}`}
          />
        </span>
        <span className="day__earn-label">
          {today ? "today’s pay" : past ? "earned" : "expected"}
        </span>
      </div>
    </article>
  );
}
