import { useMemo } from "react";
import type { Candle } from "../../lib/trading/types";
import { useDesk } from "../../lib/trading/store";

interface Props {
  candles: Map<string, Candle[]>;
}

export function ChartPanel({ candles }: Props) {
  const selected = useDesk((s) => s.selectedSymbol);
  const positions = useDesk((s) => s.positions);
  const closed = useDesk((s) => s.closed);
  const symbol = selected ?? positions[0]?.symbol ?? "BTCUSDT";
  const data = candles.get(symbol) ?? [];

  const { path, min, max, entries, exits } = useMemo(() => {
    if (data.length < 2) return { path: "", min: 0, max: 1, entries: [] as number[], exits: [] as number[] };
    const closes = data.map((c) => c.c);
    const lo = Math.min(...closes);
    const hi = Math.max(...closes);
    const range = hi - lo || 1;
    const w = 320;
    const h = 160;
    const pts = closes.map((c, i) => {
      const x = (i / (closes.length - 1)) * w;
      const y = h - ((c - lo) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    const entryTs = positions.filter((p) => p.symbol === symbol).map((p) => p.openedAt);
    const exitTs = closed.filter((c) => c.symbol === symbol).slice(0, 8).map((c) => c.closedAt);
    const toX = (ts: number) => {
      const t0 = data[0].t;
      const t1 = data[data.length - 1].t;
      if (t1 === t0) return 0;
      return ((ts - t0) / (t1 - t0)) * w;
    };
    return {
      path: `M ${pts.join(" L ")}`,
      min: lo,
      max: hi,
      entries: entryTs.map(toX),
      exits: exitTs.map(toX),
    };
  }, [data, positions, closed, symbol]);

  return (
    <div className="px-3 py-2">
      <div className="mb-2 flex items-center justify-between text-[12px]">
        <span className="font-medium">{symbol}</span>
        <span className="text-desk-muted">1m</span>
      </div>
      {data.length < 2 ? (
        <div className="py-12 text-center text-sm text-desk-muted">차트 데이터 로딩…</div>
      ) : (
        <svg viewBox="0 0 320 180" className="w-full rounded-lg border border-desk-border bg-desk-panel">
          <text x="8" y="14" fill="#848e9c" fontSize="10">{max.toPrecision(6)}</text>
          <text x="8" y="172" fill="#848e9c" fontSize="10">{min.toPrecision(6)}</text>
          <path d={path} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
          {entries.map((x, i) => (
            <circle key={`e${i}`} cx={x} cy={90} r="3" fill="#0ecb81" />
          ))}
          {exits.map((x, i) => (
            <circle key={`x${i}`} cx={x} cy={90} r="3" fill="#f6465d" />
          ))}
        </svg>
      )}
      <div className="mt-2 text-[10px] text-desk-muted">초록=진입 · 빨강=청산 마커</div>
    </div>
  );
}
