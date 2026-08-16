import { useDesk, profileLabel } from "../../lib/trading/store";

export function Header() {
  const armed = useDesk((s) => s.armed);
  const paper = useDesk((s) => s.settings.paper);
  const profile = useDesk((s) => s.settings.profile);
  const regime = useDesk((s) => s.regime);

  const regimeLabel: Record<string, string> = {
    TREND_UP: "상승추세",
    TREND_DOWN: "하락추세",
    RANGE: "횡보",
    HIGH_VOL: "고변동",
    UNKNOWN: "판단중",
  };

  return (
    <header className="flex items-center justify-between border-b border-desk-border px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-base font-bold tracking-wide">VEKTOR</span>
        <span className="rounded bg-desk-border px-1.5 py-0.5 text-[10px] text-desk-muted">
          {paper ? "PAPER" : "LIVE"}
        </span>
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
            armed
              ? "bg-desk-green/20 text-desk-green"
              : "bg-desk-border text-desk-muted"
          }`}
        >
          {armed ? "가동" : "대기"}
        </span>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-desk-muted">
        <span className="rounded border border-desk-border px-1.5 py-0.5">
          {regimeLabel[regime] ?? regime}
        </span>
        <span className="text-desk-yellow">{profileLabel(profile)}</span>
      </div>
    </header>
  );
}
