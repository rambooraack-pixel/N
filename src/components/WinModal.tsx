import { ArrowRight, Award } from 'lucide-react';
import type { WinSummary } from '../game/types';

interface WinModalProps {
  summary: WinSummary | null;
  onNextLevel: () => void;
}

export function WinModal({ summary, onNextLevel }: WinModalProps) {
  if (!summary) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="win-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md"
    >
      <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-gradient-to-b from-slate-800/95 to-slate-900/95 p-6 text-center shadow-2xl sm:p-7">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10 text-amber-300">
          <Award className="h-8 w-8" aria-hidden="true" />
        </div>

        <h2
          id="win-modal-title"
          className="text-2xl font-extrabold tracking-tight text-white [text-wrap:balance]"
        >
          Level {summary.level} Cleared
        </h2>

        <p className="mt-1.5 text-sm text-slate-300">
          {summary.perfectClear
            ? 'Perfect clear — solved without undo or extra tubes.'
            : 'All colors sorted cleanly.'}
          {summary.earnedExtraTube ? ' +1 Extra Tube earned!' : ''}
        </p>

        <div className="my-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="text-xs font-medium text-slate-400">Moves</div>
            <div className="mt-1 font-mono text-xl font-bold text-white tabular-nums">
              {summary.moves}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="text-xs font-medium text-slate-400">Bonus Earned</div>
            <div className="mt-1 font-mono text-xl font-bold text-emerald-400 tabular-nums">
              +{summary.bonus}
            </div>
          </div>
        </div>

        <button
          type="button"
          autoFocus
          onClick={onNextLevel}
          className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-400 to-emerald-400 px-5 py-3 text-base font-bold whitespace-nowrap text-slate-950 shadow-lg shadow-sky-500/25 transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        >
          <span>Next Level</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
