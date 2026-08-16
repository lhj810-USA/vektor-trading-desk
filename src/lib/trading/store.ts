import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BookState, DeskSettings, TabId, Candle } from "./types";
import { DEFAULT_SETTINGS, emptySession, PROFILES } from "./types";
import { armBook, disarmBook, flattenAll, tickBook } from "./engine";

interface DeskStore extends BookState {
  tab: TabId;
  selectedSymbol: string | null;
  lastWinAt: number;
  lastWinAmount: number;
  setTab: (t: TabId) => void;
  setSelectedSymbol: (s: string | null) => void;
  updateSettings: (partial: Partial<DeskSettings>) => void;
  arm: () => void;
  stop: () => void;
  flatten: (quotes: Map<string, number>) => void;
  applyTick: (candles: Map<string, Candle[]>, quotes: Map<string, number>) => { justWon: boolean; winAmount: number };
  resetSession: () => void;
  pushLog: (msg: string) => void;
}

function initialBook(): BookState {
  const start = DEFAULT_SETTINGS.startCapital;
  return {
    armed: false, armedAt: 0, equity: start, balance: start, freeMargin: start, marginLevel: 999,
    positions: [], closed: [], lastCycleAt: 0, lastLostSymbol: null, heroes: [],
    regime: "UNKNOWN", lastSignals: [], cooldownUntil: 0,
    session: emptySession(start), settings: { ...DEFAULT_SETTINGS },
    logs: ["VEKTOR 준비 완료 · PAPER 모드"],
  };
}

export const useDesk = create<DeskStore>()(
  persist(
    (set, get) => ({
      ...initialBook(),
      tab: "trade" as TabId,
      selectedSymbol: null as string | null,
      lastWinAt: 0,
      lastWinAmount: 0,
      setTab: (t) => set({ tab: t }),
      setSelectedSymbol: (s) => set({ selectedSymbol: s }),
      updateSettings: (partial) => set((s) => ({ settings: { ...s.settings, ...partial } })),
      arm: () => set((s) => armBook(s)),
      stop: () => set((s) => disarmBook(s)),
      flatten: (quotes) => set((s) => flattenAll(s, quotes)),
      applyTick: (candles, quotes) => {
        const { book, justWon, winAmount } = tickBook(get(), candles, quotes);
        set({
          ...book,
          lastWinAt: justWon ? Date.now() : get().lastWinAt,
          lastWinAmount: justWon ? winAmount : get().lastWinAmount,
        });
        return { justWon, winAmount };
      },
      resetSession: () => {
        const start = get().settings.startCapital;
        set({
          ...initialBook(), settings: get().settings,
          equity: start, balance: start, freeMargin: start,
          session: emptySession(start), logs: ["세션 리셋"],
        });
      },
      pushLog: (msg) => set((s) => ({ logs: [msg, ...s.logs].slice(0, 80) })),
    }),
    {
      name: "vektor-desk-v2",
      version: 2,
      partialize: (s) => ({
        equity: s.equity, balance: s.balance, freeMargin: s.freeMargin,
        positions: s.positions, closed: s.closed, session: s.session,
        settings: s.settings, heroes: s.heroes, lastLostSymbol: s.lastLostSymbol,
        logs: s.logs.slice(0, 20),
      }),
    }
  )
);

export function profileLabel(name: string): string {
  return PROFILES[name as keyof typeof PROFILES]?.label ?? name;
}
