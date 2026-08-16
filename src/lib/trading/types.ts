/** VEKTOR core types - paper desk with full rationale and regime */

export type Side = "LONG" | "SHORT";
export type Regime = "TREND_UP" | "TREND_DOWN" | "RANGE" | "HIGH_VOL" | "UNKNOWN";
export type ProfileName = "preserve" | "standard" | "attack" | "extreme";
export type TabId = "quotes" | "charts" | "trade" | "history" | "settings";

export interface Candle {
  t: number; o: number; h: number; l: number; c: number; v: number;
}

export interface Quote {
  symbol: string; price: number; changePct: number; volume: number; high: number; low: number;
}

export interface SignalScore {
  symbol: string; side: Side; score: number;
  momentum: number; meanRev: number; breakout: number; volume: number;
  regime: Regime; reason: string; atrPct: number; ret3: number; ret8: number;
}

export interface Position {
  id: string; symbol: string; side: Side; qty: number;
  entry: number; mark: number; openedAt: number; reason: string;
  layer: number; pnl: number; pnlPct: number;
}

export interface ClosedTrade {
  id: string; symbol: string; side: Side; qty: number;
  entry: number; exit: number; pnl: number; pnlPct: number;
  openedAt: number; closedAt: number; entryReason: string; exitReason: string; holdSec: number;
}

export interface RiskProfile {
  name: ProfileName; label: string; minScore: number; leverage: number;
  maxHeroes: number; initialClips: number; maxLayers: number; addGapMs: number;
  basketTpPct: number; timeStopMin: number; maxHoldMin: number; clipTp: number;
  maxPositionPct: number; dailyLossCapPct: number;
}

export const PROFILES: Record<ProfileName, RiskProfile> = {
  preserve: { name: "preserve", label: "보존", minScore: 48, leverage: 3, maxHeroes: 1, initialClips: 2, maxLayers: 4, addGapMs: 2500, basketTpPct: 0.0015, timeStopMin: 1.2, maxHoldMin: 4, clipTp: 0.06, maxPositionPct: 0.25, dailyLossCapPct: 0.02 },
  standard: { name: "standard", label: "표준", minScore: 38, leverage: 5, maxHeroes: 2, initialClips: 3, maxLayers: 5, addGapMs: 1800, basketTpPct: 0.0018, timeStopMin: 0.9, maxHoldMin: 3.2, clipTp: 0.05, maxPositionPct: 0.35, dailyLossCapPct: 0.035 },
  attack: { name: "attack", label: "공격", minScore: 28, leverage: 8, maxHeroes: 2, initialClips: 4, maxLayers: 6, addGapMs: 1200, basketTpPct: 0.002, timeStopMin: 0.6, maxHoldMin: 2.5, clipTp: 0.04, maxPositionPct: 0.45, dailyLossCapPct: 0.05 },
  extreme: { name: "extreme", label: "극한", minScore: 22, leverage: 10, maxHeroes: 3, initialClips: 5, maxLayers: 7, addGapMs: 900, basketTpPct: 0.0016, timeStopMin: 0.45, maxHoldMin: 2.2, clipTp: 0.035, maxPositionPct: 0.48, dailyLossCapPct: 0.07 },
};

export interface SessionStats {
  startedAt: number; trades: number; wins: number; losses: number;
  grossPnl: number; feesPaid: number; maxEquity: number; minEquity: number;
  bySymbol: Record<string, { trades: number; wins: number; pnl: number }>;
}

export interface DeskSettings {
  profile: ProfileName; winEffect: boolean; scanIntervalMs: number;
  startCapital: number; paper: boolean; apiKey: string; apiSecret: string;
  liveVenue: "binance.com" | "binance.us" | "testnet";
}

export interface BookState {
  armed: boolean; armedAt: number; equity: number; balance: number;
  freeMargin: number; marginLevel: number; positions: Position[]; closed: ClosedTrade[];
  lastCycleAt: number; lastLostSymbol: string | null; heroes: string[];
  regime: Regime; lastSignals: SignalScore[]; cooldownUntil: number;
  session: SessionStats; settings: DeskSettings; logs: string[];
}

export const DEFAULT_SETTINGS: DeskSettings = {
  profile: "extreme", winEffect: true, scanIntervalMs: 900,
  startCapital: 500_000, paper: true, apiKey: "", apiSecret: "", liveVenue: "binance.com",
};

export function emptySession(startEquity: number): SessionStats {
  return {
    startedAt: Date.now(), trades: 0, wins: 0, losses: 0, grossPnl: 0, feesPaid: 0,
    maxEquity: startEquity, minEquity: startEquity, bySymbol: {},
  };
}

export const PREFERRED_SYMBOLS = [
  "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", "DOGEUSDT",
  "ADAUSDT", "AVAXUSDT", "LINKUSDT", "DOTUSDT", "MATICUSDT", "LTCUSDT",
  "ATOMUSDT", "NEARUSDT", "UNIUSDT", "AAVEUSDT", "SUIUSDT", "APTUSDT",
  "ARBUSDT", "OPUSDT",
];

export const EXCLUDE_SYMBOLS = new Set([
  "ALLOUSDT", "ALLUSDT", "1000SATSUSDT", "RATSUSDT", "ORDIUSDT",
]);
