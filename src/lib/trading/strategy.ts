import type { Candle, Regime, RiskProfile, SignalScore, Side } from "./types";
import { EXCLUDE_SYMBOLS, PREFERRED_SYMBOLS } from "./types";
import { adx, atr, bollinger, ema, macd, returns, rsi, stochRsi, vwap } from "./indicators";

export function detectRegime(candles: Candle[]): Regime {
  if (candles.length < 30) return "UNKNOWN";
  const closes = candles.map((c) => c.c);
  const a = adx(candles, 14);
  const atrVal = atr(candles, 14);
  const last = closes[closes.length - 1];
  const atrPct = last > 0 ? atrVal / last : 0;
  const e21 = ema(closes, 21);
  const e55 = ema(closes, 55);
  const e21last = e21[e21.length - 1];
  const e55last = e55[e55.length - 1];
  const ret20 = returns(closes, 20);
  if (atrPct > 0.018) return "HIGH_VOL";
  if (a >= 22 && e21last > e55last && ret20 > 0.008) return "TREND_UP";
  if (a >= 22 && e21last < e55last && ret20 < -0.008) return "TREND_DOWN";
  if (a < 18) return "RANGE";
  return "UNKNOWN";
}

function momentumScore(closes: number[], side: Side) {
  const ret3 = returns(closes, 3), ret8 = returns(closes, 8);
  const e9 = ema(closes, 9), e21 = ema(closes, 21);
  const m = macd(closes);
  let score = 0;
  const parts: string[] = [];
  if (side === "LONG") {
    if (ret3 > 0.0015) { score += 18; parts.push("1분↑"); }
    if (ret8 > 0.003) { score += 12; parts.push("단기모멘텀"); }
    if (e9[e9.length - 1] > e21[e21.length - 1]) { score += 10; parts.push("EMA정렬"); }
    if (m.hist > 0) { score += 8; parts.push("MACD+"); }
  } else {
    if (ret3 < -0.0015) { score += 18; parts.push("1분↓"); }
    if (ret8 < -0.003) { score += 12; parts.push("단기모멘텀"); }
    if (e9[e9.length - 1] < e21[e21.length - 1]) { score += 10; parts.push("EMA정렬"); }
    if (m.hist < 0) { score += 8; parts.push("MACD-"); }
  }
  return { score, detail: parts.join("+") || "모멘텀약함" };
}

function meanRevScore(closes: number[], side: Side) {
  const r = rsi(closes, 14), sr = stochRsi(closes, 14), bb = bollinger(closes, 20, 2);
  const last = closes[closes.length - 1];
  let score = 0;
  const parts: string[] = [];
  if (side === "LONG") {
    if (r < 32) { score += 14; parts.push("RSI과매도"); }
    if (sr < 20) { score += 10; parts.push("Stoch과매도"); }
    if (last <= bb.lower * 1.001) { score += 12; parts.push("BB하단"); }
  } else {
    if (r > 68) { score += 14; parts.push("RSI과매수"); }
    if (sr > 80) { score += 10; parts.push("Stoch과매수"); }
    if (last >= bb.upper * 0.999) { score += 12; parts.push("BB상단"); }
  }
  return { score, detail: parts.join("+") || "평균회귀약함" };
}

function breakoutScore(candles: Candle[], side: Side) {
  if (candles.length < 25) return { score: 0, detail: "" };
  const closes = candles.map((c) => c.c);
  const highs = candles.map((c) => c.h), lows = candles.map((c) => c.l);
  const last = closes[closes.length - 1];
  const recentHigh = Math.max(...highs.slice(-20, -1));
  const recentLow = Math.min(...lows.slice(-20, -1));
  const volNow = candles[candles.length - 1].v;
  const volAvg = candles.slice(-20).reduce((a, c) => a + c.v, 0) / Math.min(20, candles.length);
  if (side === "LONG" && last > recentHigh && volNow > volAvg * 1.2) return { score: 16, detail: "고점돌파" };
  if (side === "SHORT" && last < recentLow && volNow > volAvg * 1.2) return { score: 16, detail: "저점돌파" };
  return { score: 0, detail: "" };
}

function volumeScore(candles: Candle[]) {
  if (candles.length < 15) return { score: 0, detail: "" };
  const vols = candles.map((c) => c.v);
  const last = vols[vols.length - 1];
  const avg = vols.slice(-15).reduce((a, b) => a + b, 0) / 15;
  if (avg <= 0) return { score: 0, detail: "" };
  const ratio = last / avg;
  if (ratio >= 1.8) return { score: 12, detail: "거래량급증" };
  if (ratio >= 1.3) return { score: 7, detail: "거래량↑" };
  return { score: 0, detail: "" };
}

export function evaluateSymbol(symbol: string, candles: Candle[], regime: Regime, profile: RiskProfile): SignalScore | null {
  if (candles.length < 40 || EXCLUDE_SYMBOLS.has(symbol)) return null;
  const closes = candles.map((c) => c.c);
  const last = closes[closes.length - 1];
  if (last <= 0) return null;
  const atrPct = atr(candles, 14) / last;
  if (atrPct < 0.0004 || atrPct > 0.045) return null;
  const ret3 = returns(closes, 3), ret8 = returns(closes, 8);
  if (Math.abs(returns(closes, 20)) > 0.12) return null;
  const preferredBonus = PREFERRED_SYMBOLS.includes(symbol) ? 4 : 0;
  let best: SignalScore | null = null;
  for (const side of ["LONG", "SHORT"] as Side[]) {
    if (regime === "TREND_UP" && side === "SHORT" && Math.abs(ret8) < 0.006) continue;
    if (regime === "TREND_DOWN" && side === "LONG" && Math.abs(ret8) < 0.006) continue;
    if (regime === "HIGH_VOL" && atrPct > 0.025) continue;
    const mom = momentumScore(closes, side);
    const mr = meanRevScore(closes, side);
    const br = breakoutScore(candles, side);
    const vol = volumeScore(candles);
    let score = mom.score + mr.score + br.score + vol.score + preferredBonus;
    if (regime === "RANGE") score += mr.score * 0.25;
    if (regime === "TREND_UP" || regime === "TREND_DOWN") score += mom.score * 0.2 + br.score * 0.15;
    const vw = vwap(candles, 20);
    if (side === "LONG" && last > vw) score += 4;
    if (side === "SHORT" && last < vw) score += 4;
    if (score < profile.minScore) continue;
    const reasonParts = [mom.detail, mr.detail, br.detail, vol.detail].filter(Boolean).slice(0, 3);
    const reason = reasonParts.length
      ? `${side === "LONG" ? "매수" : "매도"} · ${reasonParts.join(" · ")}`
      : `${side === "LONG" ? "매수" : "매도"} · 점수${score.toFixed(0)}`;
    const candidate: SignalScore = {
      symbol, side, score, momentum: mom.score, meanRev: mr.score,
      breakout: br.score, volume: vol.score, regime, reason, atrPct, ret3, ret8,
    };
    if (!best || candidate.score > best.score) best = candidate;
  }
  return best;
}

export function pickHeroes(candidates: SignalScore[], maxHeroes: number, lastLostSymbol: string | null): SignalScore[] {
  const filtered = candidates.filter((c) => c.symbol !== lastLostSymbol).sort((a, b) => b.score - a.score);
  const out: SignalScore[] = [];
  const seen = new Set<string>();
  for (const c of filtered) {
    if (seen.has(c.symbol)) continue;
    seen.add(c.symbol);
    out.push(c);
    if (out.length >= maxHeroes) break;
  }
  return out;
}
