import { useEffect } from "react";
import type { Insight, InsightTone } from "./insights";

type Props = {
  open: boolean;
  insights: Insight[];
  onClose: () => void;
};

const TONE_LABEL: Record<InsightTone, string> = {
  urgent: "Urgent",
  action: "Action",
  peer: "Peers",
  ok: "On track",
};

function InsightIcon({ tone }: { tone: InsightTone }) {
  switch (tone) {
    case "urgent":
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
          <path
            d="M12 3.6 21.2 20.1H2.8L12 3.6Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.85"
            strokeLinejoin="round"
          />
          <path
            d="M12 10v4.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.85"
            strokeLinecap="round"
          />
          <circle cx="12" cy="17.1" r="1.05" fill="currentColor" />
        </svg>
      );
    case "action":
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
          <circle
            cx="12"
            cy="12"
            r="8.25"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.85"
          />
          <path
            d="M12 7.2v5.1l3.2 1.9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.85"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "peer":
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
          <circle
            cx="9"
            cy="9"
            r="3.1"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.85"
          />
          <circle
            cx="16.2"
            cy="10.2"
            r="2.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.85"
          />
          <path
            d="M3.6 18.4c.7-2.5 2.8-3.9 5.4-3.9s4.7 1.4 5.4 3.9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.85"
            strokeLinecap="round"
          />
          <path
            d="M14.2 14.8c1.7-.35 3.5.25 4.5 1.85.45.7.7 1.45.8 2.15"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.85"
            strokeLinecap="round"
          />
        </svg>
      );
    case "ok":
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
          <circle
            cx="12"
            cy="12"
            r="8.25"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.85"
          />
          <path
            d="M8.2 12.2 10.8 14.8 15.8 9.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.85"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

export function InsightsPanel({ open, insights, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="settings insights"
      role="dialog"
      aria-modal="true"
      aria-labelledby="insights-title"
    >
      <button
        type="button"
        className="settings__backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className="settings__panel insights__panel"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="settings__head">
          <div>
            <h2 id="insights-title">Insights</h2>
            <p className="insights__sub">
              What to earn today, how many buffer days you have if work stops,
              then peer checks on controllable bills — not category budgets.
            </p>
          </div>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
          >
            Close
          </button>
        </header>

        {insights.length === 0 ? (
          <p className="insights__empty">
            Log a few days of pay and your next bill will surface a daily target
            and buffer-day count here.
          </p>
        ) : (
          <ul className="insights__list">
            {insights.map((insight, i) => (
              <li
                key={insight.id}
                className={`insight insight--${insight.tone}`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <span className="insight__icon" aria-hidden>
                  <InsightIcon tone={insight.tone} />
                </span>
                <div className="insight__content">
                  <div className="insight__top">
                    <span className="insight__tone">
                      {TONE_LABEL[insight.tone]}
                    </span>
                  </div>
                  <h3 className="insight__title">{insight.title}</h3>
                  <p className="insight__body">{insight.body}</p>
                  {insight.detail ? (
                    <p className="insight__detail">{insight.detail}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
