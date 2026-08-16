import { useEffect, useRef, useState } from "react";
import { fetchDeskSnapshot, fetchMarkPrices } from "../lib/binance/market";
import { useDesk } from "../lib/trading/store";
import type { Candle, Quote } from "../lib/trading/types";
import { PREFERRED_SYMBOLS } from "../lib/trading/types";

export function useTradingLoop() {
  const applyTick = useDesk((s) => s.applyTick);
  const armed = useDesk((s) => s.armed);
  const scanMs = useDesk((s) => s.settings.scanIntervalMs);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [candles, setCandles] = useState<Map<string, Candle[]>>(new Map());
  const [quoteMap, setQuoteMap] = useState<Map<string, number>>(new Map());
  const [status, setStatus] = useState("연결 중…");
  const candlesRef = useRef(candles);
  const quoteMapRef = useRef(quoteMap);

  useEffect(() => { candlesRef.current = candles; }, [candles]);
  useEffect(() => { quoteMapRef.current = quoteMap; }, [quoteMap]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const snap = await fetchDeskSnapshot(PREFERRED_SYMBOLS);
        if (cancelled) return;
        setQuotes(snap.quotes);
        setCandles(snap.candles);
        const qm = new Map<string, number>();
        for (const q of snap.quotes) qm.set(q.symbol, q.price);
        setQuoteMap(qm);
        setStatus("실시세 연결");
      } catch {
        setStatus("시세 오류 — 재시도");
      }
    };
    load();
    const id = window.setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const symbols = [
          ...new Set([
            ...PREFERRED_SYMBOLS.slice(0, 12),
            ...useDesk.getState().positions.map((p) => p.symbol),
          ]),
        ];
        const marks = await fetchMarkPrices(symbols);
        if (cancelled) return;
        const merged = new Map(quoteMapRef.current);
        marks.forEach((v, k) => merged.set(k, v));
        setQuoteMap(merged);
        applyTick(candlesRef.current, merged);
      } catch {
        applyTick(candlesRef.current, quoteMapRef.current);
      }
    };
    const id = window.setInterval(tick, Math.max(700, scanMs));
    return () => { cancelled = true; clearInterval(id); };
  }, [applyTick, scanMs, armed]);

  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    (async () => {
      try {
        if (armed && "wakeLock" in navigator) {
          lock = await navigator.wakeLock.request("screen");
        }
      } catch { /* ignore */ }
    })();
    return () => { lock?.release().catch(() => undefined); };
  }, [armed]);

  return { quotes, candles, quoteMap, status };
}
