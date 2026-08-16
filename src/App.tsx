import { Header } from "./components/desk/Header";
import { AccountBar } from "./components/desk/AccountBar";
import { PositionsList } from "./components/desk/PositionsList";
import { CommandBar } from "./components/desk/CommandBar";
import { ChartPanel } from "./components/desk/ChartPanel";
import { ReviewPanel } from "./components/desk/ReviewPanel";
import { SettingsPanel } from "./components/desk/SettingsPanel";
import { QuotesPanel } from "./components/desk/QuotesPanel";
import { WinEffect } from "./components/desk/WinEffect";
import { useDesk } from "./lib/trading/store";
import { useTradingLoop } from "./hooks/useTradingLoop";
import type { TabId } from "./lib/trading/types";

const TABS: { id: TabId; label: string }[] = [
  { id: "quotes", label: "Quotes" },
  { id: "charts", label: "Charts" },
  { id: "trade", label: "Trade" },
  { id: "history", label: "History" },
  { id: "settings", label: "설정" },
];

export default function App() {
  const tab = useDesk((s) => s.tab);
  const setTab = useDesk((s) => s.setTab);
  const lastWinAt = useDesk((s) => s.lastWinAt);
  const lastWinAmount = useDesk((s) => s.lastWinAmount);
  const winEffect = useDesk((s) => s.settings.winEffect);
  const { quotes, candles, quoteMap, status } = useTradingLoop();

  return (
    <div className="mx-auto flex h-full max-w-lg flex-col bg-desk-bg">
      <Header />
      <div className="px-3 pt-1 text-[10px] text-desk-muted">{status}</div>
      <WinEffect triggerAt={lastWinAt} amount={lastWinAmount} enabled={winEffect} />
      <div className="flex-1 overflow-hidden">
        {tab === "trade" && (
          <div className="flex h-full flex-col">
            <AccountBar />
            <div className="flex-1 overflow-hidden"><PositionsList /></div>
          </div>
        )}
        {tab === "quotes" && <QuotesPanel quotes={quotes} />}
        {tab === "charts" && <ChartPanel candles={candles} />}
        {tab === "history" && <ReviewPanel />}
        {tab === "settings" && <SettingsPanel />}
      </div>
      {tab === "trade" && <CommandBar quotes={quoteMap} />}
      <nav className="flex border-t border-desk-border bg-desk-panel">
        {TABS.map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 text-[11px] ${tab === t.id ? "text-white" : "text-desk-muted"}`}>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
