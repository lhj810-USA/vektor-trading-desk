import { useEffect } from "react";
import confetti from "canvas-confetti";

interface Props {
  triggerAt: number;
  amount: number;
  enabled: boolean;
}

export function WinEffect({ triggerAt, amount, enabled }: Props) {
  useEffect(() => {
    if (!enabled || !triggerAt) return;
    const age = Date.now() - triggerAt;
    if (age > 2500) return;

    const end = Date.now() + 900;
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ["#0ecb81", "#f0b90b", "#3b82f6"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ["#0ecb81", "#f0b90b", "#3b82f6"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [triggerAt, enabled]);

  if (!enabled || !triggerAt || Date.now() - triggerAt > 2000) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-50 flex justify-center">
      <div className="win-flash rounded-xl border border-desk-green/40 bg-desk-panel/95 px-5 py-3 text-center shadow-lg">
        <div className="text-xs text-desk-muted">익절</div>
        <div className="text-lg font-semibold text-desk-green">
          +{amount.toFixed(0)}원
        </div>
      </div>
    </div>
  );
}
