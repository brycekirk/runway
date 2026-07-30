import type { Insight } from "./insights";

type Props = {
  open: boolean;
  insights: Insight[];
  onClose: () => void;
};

const TONE_LABEL: Record<Insight["tone"], string> = {
  urgent: "Urgent",
  action: "Action",
  peer: "Peers",
  ok: "On track",
};

export function InsightsPanel({ open, insights, onClose }: Props) {
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
      <div className="settings__panel insights__panel">
        <header className="settings__head">
          <div>
            <h2 id="insights-title">Insights</h2>
            <p className="insights__sub">
              Cash-flow first, then fair peer checks on controllable bills.
            </p>
          </div>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Close
          </button>
        </header>

        {insights.length === 0 ? (
          <p className="insights__empty">
            Log a few days of earnings and your bills will surface guidance
            here.
          </p>
        ) : (
          <ul className="insights__list">
            {insights.map((insight, i) => (
              <li
                key={insight.id}
                className={`insight insight--${insight.tone}`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="insight__top">
                  <span className="insight__tone">{TONE_LABEL[insight.tone]}</span>
                </div>
                <h3 className="insight__title">{insight.title}</h3>
                <p className="insight__body">{insight.body}</p>
                {insight.detail ? (
                  <p className="insight__detail">{insight.detail}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
