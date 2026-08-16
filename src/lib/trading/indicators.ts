import type { Candle } from "./types";

export function ema(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  const out: number[] = [];
  let prev = values[0];
  for (let i = 0; i < values.length; i++) {
    prev = i === 0 ? values[0] : values[i] * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

export function rsi(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gains += d; else losses -= d;
  }
  const avgGain = gains / period, avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

export function atr(candles: Candle[], period = 14): number {
  if (candles.length < 2) return 0;
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i], p = candles[i - 1];
    trs.push(Math.max(c.h - c.l, Math.abs(c.h - p.c), Math.abs(c.l - p.c)));
  }
  const slice = trs.slice(-period);
  return slice.length ? slice.reduce((a, b) => a + b, 0) / slice.length : 0;
}

export function adx(candles: Candle[], period = 14): number {
  if (candles.length < period + 2) return 15;
  let plusDM = 0, minusDM = 0, trSum = 0;
  for (let i = candles.length - period; i < candles.length; i++) {
    const c = candles[i], p = candles[i - 1];
    const up = c.h - p.h, down = p.l - c.l;
    plusDM += up > down && up > 0 ? up : 0;
    minusDM += down > up && down > 0 ? down : 0;
    trSum += Math.max(c.h - c.l, Math.abs(c.h - p.c), Math.abs(c.l - p.c));
  }
  if (trSum === 0) return 15;
  const pdi = (plusDM / trSum) * 100, mdi = (minusDM / trSum) * 100;
  return (Math.abs(pdi - mdi) / (pdi + mdi + 1e-9)) * 100;
}

export function bollinger(closes: number[], period = 20, mult = 2) {
  if (closes.length < period) {
    const last = closes[closes.length - 1] ?? 0;
    return { mid: last, upper: last, lower: last, width: 0 };
  }
  const slice = closes.slice(-period);
  const mid = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((a, b) => a + (b - mid) ** 2, 0) / period;
  const std = Math.sqrt(variance);
  return { mid, upper: mid + mult * std, lower: mid - mult * std, width: mid > 0 ? (2 * mult * std) / mid : 0 };
}

export function macd(closes: number[]) {
  if (closes.length < 26) return { macd: 0, signal: 0, hist: 0 };
  const e12 = ema(closes, 12), e26 = ema(closes, 26);
  const macdLine = e12.map((v, i) => v - e26[i]);
  const signal = ema(macdLine, 9);
  const last = macdLine.length - 1;
  return { macd: macdLine[last], signal: signal[last], hist: macdLine[last] - signal[last] };
}

export function stochRsi(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  const rsis: number[] = [];
  for (let i = period; i < closes.length; i++) rsis.push(rsi(closes.slice(0, i + 1), period));
  const slice = rsis.slice(-period);
  const min = Math.min(...slice), max = Math.max(...slice);
  if (max === min) return 50;
  return ((slice[slice.length - 1] - min) / (max - min)) * 100;
}

export function returns(closes: number[], n: number): number {
  if (closes.length <= n) return 0;
  const a = closes[closes.length - 1], b = closes[closes.length - 1 - n];
  return b === 0 ? 0 : (a - b) / b;
}

export function vwap(candles: Candle[], lookback = 20): number {
  const slice = candles.slice(-lookback);
  let pv = 0, vol = 0;
  for (const c of slice) { pv += ((c.h + c.l + c.c) / 3) * c.v; vol += c.v; }
  return vol > 0 ? pv / vol : slice[slice.length - 1]?.c ?? 0;
}
