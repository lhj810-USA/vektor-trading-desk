import { useDesk, profileLabel } from "../../lib/trading/store";
import type { ProfileName } from "../../lib/trading/types";
import { PROFILES } from "../../lib/trading/types";

const PROFILES_LIST = Object.keys(PROFILES) as ProfileName[];

export function SettingsPanel() {
  const settings = useDesk((s) => s.settings);
  const update = useDesk((s) => s.updateSettings);
  const resetSession = useDesk((s) => s.resetSession);
  const logs = useDesk((s) => s.logs);

  return (
    <div className="no-scrollbar max-h-[75vh] overflow-y-auto px-3 py-2 text-[12px]">
      <div className="rounded-lg border border-desk-border bg-desk-panel p-3">
        <div className="text-[11px] text-desk-muted">리스크 프로필</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {PROFILES_LIST.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => update({ profile: p })}
              className={`rounded-lg border px-2 py-2 text-left ${
                settings.profile === p
                  ? "border-desk-yellow text-desk-yellow"
                  : "border-desk-border text-desk-muted"
              }`}
            >
              <div className="font-medium">{profileLabel(p)}</div>
              <div className="text-[10px]">점수≥{PROFILES[p].minScore} · {PROFILES[p].leverage}x</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-desk-border bg-desk-panel p-3">
        <label className="flex items-center justify-between">
          <span>익절 효과 (confetti)</span>
          <input
            type="checkbox"
            checked={settings.winEffect}
            onChange={(e) => update({ winEffect: e.target.checked })}
          />
        </label>
        <label className="mt-3 flex items-center justify-between">
          <span>PAPER 모드</span>
          <input
            type="checkbox"
            checked={settings.paper}
            onChange={(e) => update({ paper: e.target.checked })}
          />
        </label>
        <div className="mt-3">
          <div className="text-desk-muted">시작 자본 (원)</div>
          <input
            type="number"
            className="mt-1 w-full rounded border border-desk-border bg-desk-bg px-2 py-1.5"
            value={settings.startCapital}
            onChange={(e) => update({ startCapital: Number(e.target.value) || 500000 })}
          />
        </div>
        <button
          type="button"
          onClick={() => resetSession()}
          className="mt-3 w-full rounded-lg border border-desk-border py-2 text-desk-muted active:bg-white/5"
        >
          세션 리셋
        </button>
      </div>

      <div className="mt-3">
        <div className="mb-1 text-[11px] text-desk-muted">로그</div>
        <div className="max-h-40 overflow-y-auto rounded-lg border border-desk-border bg-desk-panel p-2 font-mono text-[10px] text-desk-muted">
          {logs.slice(0, 25).map((l, i) => (
            <div key={i} className="truncate">{l}</div>
          ))}
        </div>
      </div>

      <div className="mt-4 text-[10px] leading-relaxed text-desk-muted">
        바이낸스 선물 PAPER 데스크입니다. 실제 주문은 API 키와 LIVE 전환 후에만 가능합니다.
        암호화폐 거래는 원금 손실 위험이 큽니다.
      </div>
    </div>
  );
}
