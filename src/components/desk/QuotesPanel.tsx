import type { Quote } from "../../lib/trading/types";
import { useDesk } from "../../lib/trading/store";

interface Props { quotes: Quote[]; }

export function QuotesPanel({ quotes }: Props) {
  const signals = useDesk((s) => s.lastSignals);
  const setSelected = useDesk((s) => s.setSelectedSymbol);
  const setTab = useDesk((s) => s.setTab);
  const scoreMap = new Map(signals.map((s) => [s.symbol, s]));

  return (
    <div className="no-scrollbar max-h-[70vh] overflow-y-auto">
      <div className="px-3 py-1.5 text-[11px] text-desk-muted">유니버스 · 점수 높은 순 신호</div>
      <div className="divide-y divide-desk-border/50">
        {quotes.map((q) => {
          const sig = scoreMap.get(q.symbol);
          return (
            <button key={q.symbol} type="button"
              className="flex w-full items-center justify-between px-3 py-2 text-left active:bg-white/5"
              onClick={() => { setSelected(q.symbol); setTab("charts"); }}>
              <div>
                <div className="text-[13px] font-medium">{q.symbol}</div>
                <div className="text-[10px] text-desk-muted">{sig ? sig.reason : "신호 대기"}</div>
              </div>
              <div className="text-right">
                <div className="text-[13px]">{q.price.toPrecision(6)}</div>
                <div className={`text-[11px] ${q.changePct >= 0 ? "text-desk-green" : "text-desk-red"}`}>
                  {q.changePct >= 0 ? "+" : ""}{q.changePct.toFixed(2)}%
                  {sig && <span className="ml-1 text-desk-yellow"> · {sig.score.toFixed(0)}</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
