import type { BookState, ClosedTrade, Position, RiskProfile, SignalScore, Side, Candle } from "./types";
import { PROFILES } from "./types";
import { evaluateSymbol, pickHeroes, detectRegime } from "./strategy";

const FEE_RATE = 0.0004;
const SLIP_RATE = 0.00012;

function slipPrice(price: number, side: Side, isOpen: boolean): number {
  if (isOpen) return side === "LONG" ? price * (1 + SLIP_RATE) : price * (1 - SLIP_RATE);
  return side === "LONG" ? price * (1 - SLIP_RATE) : price * (1 + SLIP_RATE);
}
function fee(n: number) { return n * FEE_RATE; }
function uid(p: string) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
function lotForEquity(equity: number, layers: number) {
  const base = Math.max(0.5, Math.min(8, equity / 400_000));
  return Math.round(Math.max(0.5, Math.min(12, base * (1 + layers * 0.15))) * 100) / 100;
}
function netFloating(positions: Position[], quotes: Map<string, number>) {
  let total = 0;
  for (const p of positions) {
    const mark = quotes.get(p.symbol) ?? p.mark;
    const dir = p.side === "LONG" ? 1 : -1;
    const unit = 100;
    total += dir * (mark - p.entry) * p.qty * unit - fee(p.entry * p.qty * unit) - fee(mark * p.qty * unit);
  }
  return total;
}
function updateMarks(positions: Position[], quotes: Map<string, number>): Position[] {
  return positions.map((p) => {
    const mark = quotes.get(p.symbol) ?? p.mark;
    const dir = p.side === "LONG" ? 1 : -1;
    const unit = 100;
    const raw = dir * (mark - p.entry) * p.qty * unit;
    const fees = fee(p.entry * p.qty * unit) + fee(mark * p.qty * unit);
    const pnl = raw - fees;
    const notional = p.entry * p.qty * unit;
    return { ...p, mark, pnl, pnlPct: notional > 0 ? (pnl / notional) * 100 : 0 };
  });
}
function openLayer(book: BookState, signal: SignalScore, price: number, layer: number, profile: RiskProfile): BookState {
  const fill = slipPrice(price, signal.side, true);
  const qty = lotForEquity(book.equity, layer);
  const pos: Position = {
    id: uid("p"), symbol: signal.symbol, side: signal.side, qty,
    entry: fill, mark: fill, openedAt: Date.now(), reason: signal.reason,
    layer, pnl: 0, pnlPct: 0,
  };
  const marginUsed = (fill * qty * 100) / profile.leverage;
  return {
    ...book,
    positions: [...book.positions, pos],
    freeMargin: Math.max(0, book.freeMargin - marginUsed * 0.15),
    logs: [`진입 ${signal.symbol} ${signal.side} ${qty.toFixed(2)} @ ${fill.toPrecision(6)} · ${signal.reason}`, ...book.logs].slice(0, 80),
  };
}
function closeBasket(book: BookState, symbol: string, exitReason: string, quotes: Map<string, number>) {
  const group = book.positions.filter((p) => p.symbol === symbol);
  const rest = book.positions.filter((p) => p.symbol !== symbol);
  if (!group.length) return { book, realized: 0, win: false };
  let realized = 0;
  const closed: ClosedTrade[] = [];
  const now = Date.now();
  for (const p of group) {
    const mark = quotes.get(p.symbol) ?? p.mark;
    const exit = slipPrice(mark, p.side, false);
    const dir = p.side === "LONG" ? 1 : -1;
    const unit = 100;
    const pnl = dir * (exit - p.entry) * p.qty * unit - fee(p.entry * p.qty * unit) - fee(exit * p.qty * unit);
    realized += pnl;
    closed.push({
      id: uid("c"), symbol: p.symbol, side: p.side, qty: p.qty,
      entry: p.entry, exit, pnl,
      pnlPct: p.entry > 0 ? (pnl / (p.entry * p.qty * unit)) * 100 : 0,
      openedAt: p.openedAt, closedAt: now, entryReason: p.reason, exitReason,
      holdSec: (now - p.openedAt) / 1000,
    });
  }
  const win = realized > 0;
  const newEquity = book.equity + realized;
  const session = { ...book.session };
  session.trades += closed.length;
  if (win) session.wins += 1; else session.losses += 1;
  session.grossPnl += realized;
  session.maxEquity = Math.max(session.maxEquity, newEquity);
  session.minEquity = Math.min(session.minEquity, newEquity);
  const sym = session.bySymbol[symbol] ?? { trades: 0, wins: 0, pnl: 0 };
  sym.trades += closed.length;
  if (win) sym.wins += 1;
  sym.pnl += realized;
  session.bySymbol[symbol] = sym;
  return {
    book: {
      ...book,
      positions: rest,
      closed: [...closed, ...book.closed].slice(0, 200),
      equity: newEquity,
      balance: newEquity,
      freeMargin: Math.min(newEquity, book.freeMargin + Math.abs(realized) * 0.3),
      lastCycleAt: now,
      lastLostSymbol: win ? book.lastLostSymbol : symbol,
      heroes: book.heroes.filter((h) => h !== symbol),
      session,
      logs: [`${win ? "✅ 익절" : "청산"} ${symbol} ${exitReason} · ${realized >= 0 ? "+" : ""}${realized.toFixed(0)}원`, ...book.logs].slice(0, 80),
    },
    realized,
    win,
  };
}

export function tickBook(
  book: BookState,
  candlesBySymbol: Map<string, Candle[]>,
  quotes: Map<string, number>,
  now = Date.now()
): { book: BookState; justWon: boolean; winAmount: number } {
  const profile = PROFILES[book.settings.profile] ?? PROFILES.extreme;
  let state = { ...book };
  let justWon = false;
  let winAmount = 0;
  state.positions = updateMarks(state.positions, quotes);
  const floating = netFloating(state.positions, quotes);
  state.equity = state.balance + floating;
  const usedMargin = state.positions.reduce((a, p) => a + (p.entry * p.qty * 100) / profile.leverage, 0);
  state.freeMargin = Math.max(0, state.equity - usedMargin * 0.2);
  state.marginLevel = usedMargin > 0 ? (state.equity / (usedMargin * 0.2 + 1e-9)) * 100 : 999;
  const btc = candlesBySymbol.get("BTCUSDT") ?? candlesBySymbol.values().next().value;
  if (btc) state.regime = detectRegime(btc);

  for (const sym of [...new Set(state.positions.map((p) => p.symbol))]) {
    const group = state.positions.filter((p) => p.symbol === sym);
    if (!group.length) continue;
    const oldest = Math.min(...group.map((p) => p.openedAt));
    const ageSec = (now - oldest) / 1000;
    const net = group.reduce((a, p) => a + p.pnl, 0);
    const side = group[0].side;
    const avg = group.reduce((a, p) => a + p.entry * p.qty, 0) / group.reduce((a, p) => a + p.qty, 0);
    const mark = quotes.get(sym) ?? group[0].mark;
    const takeFloor = Math.max(0.15, state.equity * profile.basketTpPct * 0.15);

    if (ageSec >= 8 && net >= takeFloor) {
      const res = closeBasket(state, sym, "바스켓 익절", quotes);
      state = res.book;
      if (res.win) { justWon = true; winAmount = res.realized; }
      continue;
    }
    if (ageSec >= 14 && net > 0.5) {
      const res = closeBasket(state, sym, "본전+ 익절", quotes);
      state = res.book;
      if (res.win) { justWon = true; winAmount = res.realized; }
      continue;
    }
    const against = side === "SHORT" ? mark > avg * 1.00035 : mark < avg * 0.99965;
    if (
      against &&
      group.length < profile.maxLayers &&
      ageSec < profile.maxHoldMin * 60 &&
      now - Math.max(...group.map((p) => p.openedAt)) >= profile.addGapMs
    ) {
      state = openLayer(
        state,
        {
          symbol: sym, side, score: 40, momentum: 0, meanRev: 0, breakout: 0, volume: 0,
          regime: state.regime, reason: `복구 레이어 ${group.length + 1}`, atrPct: 0, ret3: 0, ret8: 0,
        },
        mark,
        group.length + 1,
        profile
      );
      continue;
    }
    if (ageSec >= 28 && net < 0) {
      const hardAgainst = side === "SHORT" ? mark > avg * 1.0005 : mark < avg * 0.9995;
      if (hardAgainst) {
        const res = closeBasket(state, sym, "반전 청산", quotes);
        state = res.book;
        const opp: Side = side === "LONG" ? "SHORT" : "LONG";
        for (let i = 1; i <= Math.min(3, profile.initialClips); i++) {
          state = openLayer(
            state,
            {
              symbol: sym, side: opp, score: 35, momentum: 0, meanRev: 0, breakout: 0, volume: 0,
              regime: state.regime, reason: `반전 재진입 ${opp}`, atrPct: 0, ret3: 0, ret8: 0,
            },
            mark,
            i,
            profile
          );
        }
        continue;
      }
    }
    if (ageSec >= profile.maxHoldMin * 60 && net < 0) {
      state = closeBasket(state, sym, "시간초과 청산", quotes).book;
    }
  }

  if (!state.armed || now < state.cooldownUntil || now - state.armedAt < 7000) {
    return { book: state, justWon, winAmount };
  }
  const dayPnl = state.equity - state.settings.startCapital;
  if (dayPnl < -state.settings.startCapital * profile.dailyLossCapPct) {
    return {
      book: { ...state, armed: false, logs: ["⛔ 일일 손실한도 — 자동 정지", ...state.logs].slice(0, 80) },
      justWon,
      winAmount,
    };
  }

  const signals: SignalScore[] = [];
  for (const [sym, candles] of candlesBySymbol) {
    const sig = evaluateSymbol(sym, candles, state.regime, profile);
    if (sig) signals.push(sig);
  }
  state.lastSignals = signals.sort((a, b) => b.score - a.score).slice(0, 12);
  const openSymbols = new Set(state.positions.map((p) => p.symbol));
  const room = profile.maxHeroes - openSymbols.size;
  if (room <= 0) return { book: state, justWon, winAmount };

  const heroes = pickHeroes(
    signals.filter((s) => !openSymbols.has(s.symbol)),
    room,
    state.lastLostSymbol
  );
  for (const h of heroes) {
    const price = quotes.get(h.symbol);
    if (!price || h.score < profile.minScore) continue;
    for (let i = 1; i <= profile.initialClips; i++) {
      state = openLayer(state, h, price, i, profile);
    }
    state.heroes = [...new Set([...state.heroes, h.symbol])];
  }
  if (heroes.length > 0) state.cooldownUntil = now + 4500;
  return { book: state, justWon, winAmount };
}

export function armBook(book: BookState): BookState {
  const now = Date.now();
  return {
    ...book,
    armed: true,
    armedAt: now,
    cooldownUntil: now + 7000,
    logs: ["🟢 가동 — 7초 후 신호 대기", ...book.logs].slice(0, 80),
  };
}
export function disarmBook(book: BookState): BookState {
  return { ...book, armed: false, logs: ["⏹ 정지", ...book.logs].slice(0, 80) };
}
export function flattenAll(book: BookState, quotes: Map<string, number>): BookState {
  let state = book;
  for (const sym of [...new Set(state.positions.map((p) => p.symbol))]) {
    state = closeBasket(state, sym, "수동 청산", quotes).book;
  }
  return { ...state, armed: false, heroes: [] };
}
