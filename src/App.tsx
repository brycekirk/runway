import { useEffect, useState } from "react";
import { InsightsPanel } from "./InsightsPanel";
import {
  buildInsights,
  primaryInsight,
  urgentInsightCount,
} from "./insights";
import { Runway } from "./Runway";
import { SettingsPanel } from "./SettingsPanel";
import { loadState, saveState, type PersistedState } from "./storage";
import "./App.css";

export default function App() {
  const [state, setState] = useState<PersistedState>(() => loadState());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const insights = buildInsights({
    startingBalance: state.startingBalance,
    monthlyExpenses: state.monthlyExpenses,
    oneTimeExpenses: state.oneTimeExpenses,
    earnings: state.earnings,
  });

  return (
    <div className="app">
      <main className="app__main">
        <Runway
          startingBalance={state.startingBalance}
          monthlyExpenses={state.monthlyExpenses}
          oneTimeExpenses={state.oneTimeExpenses}
          earnings={state.earnings}
          headline={primaryInsight(insights)}
          insightCount={insights.length}
          urgentCount={urgentInsightCount(insights)}
          onEarn={(key, amount) =>
            setState((prev) => ({
              ...prev,
              earnings: { ...prev.earnings, [key]: amount },
            }))
          }
          onAddOneTimeExpense={(expense) =>
            setState((prev) => ({
              ...prev,
              oneTimeExpenses: [
                ...prev.oneTimeExpenses,
                { id: crypto.randomUUID(), ...expense },
              ],
            }))
          }
          onRemoveOneTimeExpense={(id) =>
            setState((prev) => ({
              ...prev,
              oneTimeExpenses: prev.oneTimeExpenses.filter((e) => e.id !== id),
            }))
          }
          onOpenInsights={() => setInsightsOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </main>

      <InsightsPanel
        open={insightsOpen}
        insights={insights}
        onClose={() => setInsightsOpen(false)}
      />

      <SettingsPanel
        open={settingsOpen}
        startingBalance={state.startingBalance}
        expenses={state.monthlyExpenses}
        onClose={() => setSettingsOpen(false)}
        onSave={({ startingBalance, expenses }) => {
          setState((prev) => ({
            ...prev,
            startingBalance,
            monthlyExpenses: expenses,
          }));
        }}
      />
    </div>
  );
}
