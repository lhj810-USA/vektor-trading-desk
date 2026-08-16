import { useDesk } from "../../lib/trading/store";

export function ReviewPanel() {
  const session = useDesk((s) => s.session);
  const closed = useDesk((s) => s.closed);
  const equity = useDesk((s) => s.equity);
  const start = useDesk((s) => s.settings.startCapital);
  const total = session.wins + session.losses;
  const wr = total > 0 ? ((session.wins / total) * 100).toFixed(1) : "—";
  const bySym = Object.entries(session.bySymbol).sort((a, b) => b[1].pnl - a[1].pnl);

  return (
    <div className="no-scrollbar max-h-[75vh] overflow-y-auto px-3 py-2 text-[12px]">
      <div className="rounded-lg border border-desk-border bg-desk-panel p-3">
        <div className="text-[11px] text-desk-muted">세션 요약</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div>
            <div className="text-desk-muted">자산</div>
            <div className="text-base font-medium">{equity.toFixed(0)}원</div>
          </div>
          <div>
            <div className="text-desk-muted">손익</div>
            <div className={`text-base font-medium ${session.grossPnl >= 0 ? "text-desk-green" : "text-desk-red"}`}>
              {session.grossPnl >= 0 ? "+" : ""}{session.grossPnl.toFixed(0)}원
            </div>
          </div>
          <div>
            <div className="text-desk-muted">승률</div>
            <div>{wr}% ({session.wins}W/{session.losses}L)</div>
          </div>
          <div>
            <div className="text-desk-muted">시작</div>
            <div>{start.toLocaleString()}원</div>
          </div>
        </div>
      </div>

      {bySym.length > 0 && (
        <div className="mt-3">
          <div className="mb-1 text-[11px] text-desk-muted">심볼별</div>
          <div className="divide-y divide-desk-border/50 rounded-lg border border-desk-border">
            {bySym.map(([sym, s]) => (
              <div key={sym} className="flex justify-between px-3 py-2">
                <span>{sym}</span>
                <span className={s.pnl >= 0 ? "text-desk-green" : "text-desk-red"}>
                  {s.pnl >= 0 ? "+" : ""}{s.pnl.toFixed(0)} · {s.wins}/{s.trades}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3">
        <div className="mb-1 text-[11px] text-desk-muted">최근 청산</div>
        {closed.length === 0 ? (
          <div className="py-6 text-center text-desk-muted">기록 없음</div>
        ) : (
          <div className="divide-y divide-desk-border/50 rounded-lg border border-desk-border">
            {closed.slice(0, 30).map((c) => (
              <div key={c.id} className="px-3 py-2">
                <div className="flex justify-between">
                  <span>{c.symbol} {c.side === "LONG" ? "buy" : "sell"}</span>
                  <span className={c.pnl >= 0 ? "text-desk-green" : "text-desk-red"}>
                    {c.pnl >= 0 ? "+" : ""}{c.pnl.toFixed(2)}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-[10px] text-desk-muted">
                  {c.exitReason} · {c.holdSec.toFixed(0)}s · {c.entryReason}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
