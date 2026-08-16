import type { Candle, Quote } from "../trading/types";
import { PREFERRED_SYMBOLS } from "../trading/types";

const BASE = "https://fapi.binance.com";
const FALLBACK = "https://data-api.binance.vision";

async function fetchJson<T>(path: string): Promise<T> {
  const urls = [`${BASE}${path}`, `${FALLBACK}${path}`];
  let lastErr: unknown;
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`${res.status}`);
      return (await res.json()) as T;
    } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

export async function fetchKlines(symbol: string, limit = 80): Promise<Candle[]> {
  const data = await fetchJson<[number, string, string, string, string, string, ...unknown[]][]>(
    `/fapi/v1/klines?symbol=${symbol}&interval=1m&limit=${limit}`
  );
  return data.map((r) => ({
    t: r[0], o: parseFloat(r[1]), h: parseFloat(r[2]), l: parseFloat(r[3]), c: parseFloat(r[4]), v: parseFloat(r[5]),
  }));
}

export async function fetchQuotes(symbols: string[] = PREFERRED_SYMBOLS): Promise<Quote[]> {
  const data = await fetchJson<{ symbol: string; lastPrice: string; priceChangePercent: string; volume: string; highPrice: string; lowPrice: string }[]>(
    `/fapi/v1/ticker/24hr`
  );
  const set = new Set(symbols);
  return data
    .filter((d) => set.has(d.symbol) && d.symbol.endsWith("USDT"))
    .map((d) => ({
      symbol: d.symbol,
      price: parseFloat(d.lastPrice),
      changePct: parseFloat(d.priceChangePercent),
      volume: parseFloat(d.volume),
      high: parseFloat(d.highPrice),
      low: parseFloat(d.lowPrice),
    }))
    .sort((a, b) => b.volume - a.volume);
}

export async function fetchDeskSnapshot(symbols: string[] = PREFERRED_SYMBOLS) {
  const quotes = await fetchQuotes(symbols);
  const top = quotes.slice(0, 12).map((q) => q.symbol);
  if (!top.includes("BTCUSDT")) top.unshift("BTCUSDT");
  const unique = [...new Set(top)].slice(0, 14);
  const candles = new Map<string, Candle[]>();
  await Promise.all(unique.map(async (sym) => {
    try { candles.set(sym, await fetchKlines(sym, 80)); } catch { /* skip */ }
  }));
  return { quotes, candles };
}

export async function fetchMarkPrices(symbols: string[]): Promise<Map<string, number>> {
  const data = await fetchJson<{ symbol: string; markPrice: string }[]>(`/fapi/v1/premiumIndex`);
  const set = new Set(symbols);
  const map = new Map<string, number>();
  for (const d of data) if (set.has(d.symbol)) map.set(d.symbol, parseFloat(d.markPrice));
  return map;
}
