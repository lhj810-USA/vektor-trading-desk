import { useDesk } from "../../lib/trading/store";

interface Props {
  quotes: Map<string, number>;
}

export function CommandBar({ quotes }: Props) {
  const armed = useDesk((s) => s.armed);
  const arm = useDesk((s) => s.arm);
  const stop = useDesk((s) => s.stop);
  const flatten = useDesk((s) => s.flatten);
  const positions = useDesk((s) => s.positions);

  return (
    <div className="flex gap-2 border-t border-desk-border bg-desk-bg px-3 py-2">
      {armed ? (
        <button
          type="button"
          onClick={() => stop()}
          className="flex-1 rounded-lg bg-desk-panel py-3 text-sm font-medium text-white active:opacity-80"
        >
          정지
        </button>
      ) : (
        <button
          type="button"
          onClick={() => arm()}
          className="flex-1 rounded-lg bg-desk-green py-3 text-sm font-semibold text-black active:opacity-90"
        >
          시작
        </button>
      )}
      <button
        type="button"
        disabled={positions.length === 0}
        onClick={() => flatten(quotes)}
        className="flex-1 rounded-lg bg-desk-red py-3 text-sm font-semibold text-white disabled:opacity-40 active:opacity-90"
      >
        청산
      </button>
    </div>
  );
}
