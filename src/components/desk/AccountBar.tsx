import { useDesk } from "../../lib/trading/store";

export function AccountBar() {
  const equity = useDesk((s) => s.equity);
  const balance = useDesk((s) => s.balance);
  const freeMargin = useDesk((s) => s.freeMargin);
  const marginLevel = useDesk((s) => s.marginLevel);
  const start = useDesk((s) => s.settings.startCapital);
  const session = useDesk((s) => s.session);

  const wr =
    session.wins + session.losses > 0
      ? ((session.wins / (session.wins + session.losses)) * 100).toFixed(0)
      : "—";

  return (
    <div className="mx-3 mt-2 rounded-lg border border-desk-border bg-desk-panel px-3 py-2 text-[12px]">
      <div className="flex justify-between">
        <span className="text-desk-muted">Free margin</span>
        <span>{freeMargin.toFixed(2)}</span>
      </div>
      <div className="mt-1 flex justify-between">
        <span className="text-desk-muted">Margin level (%)</span>
        <span className={marginLevel < 200 ? "text-desk-red" : "text-desk-green"}>
          {marginLevel > 900 ? "—" : marginLevel.toFixed(2)}
        </span>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-desk-muted">
        <span>KRW {equity.toFixed(0)}원</span>
        <span>·</span>
        <span>시작 {start.toLocaleString()}원</span>
        <span>·</span>
        <span>사이클 {session.wins + session.losses}</span>
        <span>·</span>
        <span>승률 {wr}%</span>
      </div>
      <div className="mt-0.5 text-[10px] text-desk-muted">
        잔고 {balance.toFixed(0)} · 실현 {session.grossPnl >= 0 ? "+" : ""}
        {session.grossPnl.toFixed(0)}원
      </div>
    </div>
  );
}
