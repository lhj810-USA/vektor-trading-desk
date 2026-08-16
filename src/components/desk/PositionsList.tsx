import { useDesk } from "../../lib/trading/store";

function fmt(n: number, digits = 2) {
  return n.toFixed(digits);
}

export function PositionsList() {
  const positions = useDesk((s) => s.positions);
  const setSelected = useDesk((s) => s.setSelectedSymbol);
  const setTab = useDesk((s) => s.setTab);

  if (positions.length === 0) {
    return (
      <div className="px-3 py-8 text-center text-sm text-desk-muted">
        포지션 없음
        <div className="mt-1 text-[11px]">가동 후 강한 신호만 진입합니다</div>
      </div>
    );
  }

  return (
    <div className="no-scrollbar max-h-[52vh] overflow-y-auto">
      <div className="flex items-center justify-between px-3 py-1.5 text-[11px] text-desk-muted">
        <span>Positions</span>
        <span>{positions.length}</span>
      </div>
      <div className="divide-y divide-desk-border/60">
        {positions.map((p) => {
          const sideKo = p.side === "LONG" ? "buy" : "sell";
          const color = p.pnl >= 0 ? "text-desk-green" : "text-desk-red";
          return (
            <button
              key={p.id}
              type="button"
              className="pos-enter flex w-full items-start justify-between px-3 py-2 text-left active:bg-white/5"
              onClick={() => {
                setSelected(p.symbol);
                setTab("charts");
              }}
            >
              <div className="min-w-0 flex-1">
                <div className="text-[13px]">
                  <span className="font-medium">{p.symbol.replace("USDT", "m")}</span>
                  <span className="text-desk-muted">, </span>
                  <span className={p.side === "LONG" ? "text-desk-green" : "text-desk-red"}>
                    {sideKo}
                  </span>
                  <span className="text-desk-muted"> {fmt(p.qty)}</span>
                </div>
                <div className="mt-0.5 truncate text-[10px] text-desk-muted">
                  {p.entry.toPrecision(6)} → {p.mark.toPrecision(6)}
                </div>
                <div className="mt-0.5 truncate text-[10px] text-desk-blue/80">
                  {p.reason}
                </div>
              </div>
              <div className={`ml-2 shrink-0 text-right text-[13px] font-medium ${color}`}>
                {p.pnl >= 0 ? "+" : ""}
                {fmt(p.pnl, 2)}
                <div className="text-[10px] opacity-70">
                  {p.pnlPct >= 0 ? "+" : ""}
                  {fmt(p.pnlPct, 2)}%
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
