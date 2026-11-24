import { X } from 'lucide-react';
import { useEffect } from 'react';

interface RulesModalProps {
  open: boolean;
  onClose: () => void;
}

export function RulesModal({ open, onClose }: RulesModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-900 p-6 text-left shadow-2xl"
      >
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
          <h2 id="rules-modal-title" className="text-lg font-bold text-white">
            How to Play
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close rules"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-300">
          <p>
            Sort all gems so every tube holds 4 matching colors. Every generated board is
            verified solvable before play begins.
          </p>
          <ul className="list-disc space-y-1.5 pl-5 text-slate-300">
            <li>Tap or click a tube to lift its top matching stack of gems.</li>
            <li>Place gems only onto the same color or into an empty tube with space.</li>
            <li>Every 5th level is a Mystery stage where lower gems stay hidden until uncovered.</li>
            <li>Earn +1 Extra Tube every 3 levels cleared.</li>
          </ul>
        </div>

        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="mb-2.5 text-xs font-semibold tracking-wide text-slate-400 uppercase">
            Keyboard Shortcuts
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
            <div className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2">
              <span>Undo Move</span>
              <kbd className="font-mono font-bold text-sky-300">Z</kbd>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2">
              <span>Smart Hint</span>
              <kbd className="font-mono font-bold text-sky-300">H</kbd>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2">
              <span>Restart Level</span>
              <kbd className="font-mono font-bold text-sky-300">R</kbd>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2">
              <span>Mute Sound</span>
              <kbd className="font-mono font-bold text-sky-300">M</kbd>
            </div>
            <div className="col-span-2 flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2">
              <span>Advance on Victory Modal</span>
              <kbd className="font-mono font-bold text-sky-300">Enter / Space</kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
