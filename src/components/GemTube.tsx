import { Crown, HelpCircle } from 'lucide-react';
import { CAPACITY, GEMS, type Tube } from '../game/types';
import { contiguousTopCount, isTubeSolved } from '../game/solver';

interface GemTubeProps {
  index: number;
  tube: Tube;
  isSelected: boolean;
  isHintFrom: boolean;
  isHintTo: boolean;
  isShaking: boolean;
  justDropped: boolean;
  showSymbols: boolean;
  onSelect: (index: number, el: HTMLButtonElement | null) => void;
}

export function GemTube({
  index,
  tube,
  isSelected,
  isHintFrom,
  isHintTo,
  isShaking,
  justDropped,
  showSymbols,
  onSelect,
}: GemTubeProps) {
  const solved = isTubeSolved(tube);
  const liftCount = isSelected ? contiguousTopCount(tube) : 0;

  const topGem = tube.length > 0 ? tube[tube.length - 1] : null;
  const topTheme = topGem && !topGem.hidden ? GEMS[topGem.c % GEMS.length] : null;
  const ariaLabel = solved
    ? `Tube ${index + 1}: Completed with 4 ${topTheme?.name ?? ''} gems`
    : tube.length === 0
      ? `Tube ${index + 1}: Empty`
      : `Tube ${index + 1}: ${tube.length} of ${CAPACITY} gems, top is ${topTheme?.name ?? 'hidden'}${isSelected ? ', selected' : ''}`;

  let borderClasses =
    'border-white/25 border-t-white/45 bg-gradient-to-br from-white/12 to-white/[0.03] shadow-[inset_0_-10px_20px_rgba(0,0,0,0.32),0_12px_24px_rgba(0,0,0,0.35)]';

  if (solved) {
    borderClasses =
      'border-amber-400 border-t-amber-300 bg-gradient-to-br from-amber-400/15 to-amber-500/[0.04] shadow-[0_0_24px_rgba(251,191,36,0.32),inset_0_0_18px_rgba(251,191,36,0.14)]';
  } else if (isSelected) {
    borderClasses =
      'border-sky-400 border-t-sky-300 bg-gradient-to-br from-sky-400/18 to-sky-500/[0.05] shadow-[0_0_26px_rgba(56,189,248,0.45),inset_0_-10px_20px_rgba(0,0,0,0.28)]';
  } else if (isHintFrom) {
    borderClasses =
      'border-emerald-400 border-t-emerald-300 bg-gradient-to-br from-emerald-400/15 to-emerald-500/[0.04] animate-hint-from';
  } else if (isHintTo) {
    borderClasses =
      'border-amber-400 border-t-amber-300 bg-gradient-to-br from-amber-400/15 to-amber-500/[0.04] animate-hint-to';
  }

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={isSelected}
      onClick={(e) => onSelect(index, e.currentTarget)}
      className={`group relative flex flex-col items-center rounded-2xl p-1 transition-transform duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1120] ${
        isShaking ? 'animate-tube-shake' : 'hover:-translate-y-0.5'
      }`}
    >
      {/* Top indicator: Solved Crown or Hint Label */}
      <div className="mb-1.5 flex h-6 items-center justify-center">
        {solved ? (
          <span
            className="inline-flex items-center gap-1 text-[11px] font-bold tracking-wide text-amber-300"
            title="Completed tube"
          >
            <Crown className="h-4 w-4 fill-amber-400 text-amber-300" aria-hidden="true" />
          </span>
        ) : isHintFrom ? (
          <span className="font-mono text-[11px] font-bold tracking-wider text-emerald-300 uppercase">
            Pick
          </span>
        ) : isHintTo ? (
          <span className="font-mono text-[11px] font-bold tracking-wider text-amber-300 uppercase">
            Drop
          </span>
        ) : null}
      </div>

      {/* Glass Tube Container */}
      <div
        className={`relative flex h-[196px] w-[58px] flex-col-reverse items-center justify-start gap-1.5 rounded-t-xl rounded-b-[28px] border-2 border-t-4 px-1.5 pt-2 pb-2.5 transition-[border-color,box-shadow,background] duration-200 sm:h-[224px] sm:w-[68px] ${borderClasses}`}
      >
        {/* Specular glass reflection streak */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-2.5 left-1.5 h-[calc(100%-34px)] w-1 rounded-full bg-gradient-to-b from-white/25 to-transparent"
        />

        {tube.map((gem, gIdx) => {
          const isLifted = liftCount > 0 && gIdx >= tube.length - liftCount;
          const isDropIn = justDropped && gIdx === tube.length - 1;
          const theme = GEMS[gem.c % GEMS.length];

          if (gem.hidden) {
            return (
              <div
                key={gIdx}
                className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full border-2 border-dashed border-slate-400/35 bg-gradient-to-br from-slate-600 to-slate-800 shadow-[inset_-3px_-4px_8px_rgba(0,0,0,0.4),0_3px_6px_rgba(0,0,0,0.3)] sm:h-[46px] sm:w-[46px]"
              >
                <HelpCircle className="h-5 w-5 text-slate-300/80" aria-hidden="true" />
              </div>
            );
          }

          return (
            <div
              key={gIdx}
              style={{ background: theme.bg }}
              className={`relative flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] sm:h-[46px] sm:w-[46px] ${
                isLifted
                  ? 'z-10 -translate-y-5 scale-[1.08] brightness-110 shadow-[0_14px_20px_rgba(0,0,0,0.48),inset_-4px_-5px_10px_rgba(0,0,0,0.3),inset_4px_4px_8px_rgba(255,255,255,0.48)]'
                  : 'shadow-[inset_-4px_-5px_10px_rgba(0,0,0,0.35),inset_4px_4px_8px_rgba(255,255,255,0.4),0_4px_8px_rgba(0,0,0,0.35)]'
              } ${isDropIn ? 'animate-pop-drop' : ''}`}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className={`h-[56%] w-[56%] fill-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] transition-opacity duration-150 ${
                  showSymbols ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <path d={theme.path} />
              </svg>
            </div>
          );
        })}
      </div>

      {/* Subtle index label for keyboard/visual orientation */}
      <span className="mt-1.5 font-mono text-[11px] font-medium text-slate-500 tabular-nums transition-colors group-hover:text-slate-300">
        {index + 1}
      </span>
    </button>
  );
}
