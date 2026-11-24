import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Flame,
  HelpCircle,
  Lightbulb,
  PlusSquare,
  RotateCcw,
  Shapes,
  Undo2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { GemTube } from './components/GemTube';
import { ParticleCanvas, type ParticleCanvasHandle } from './components/ParticleCanvas';
import { RulesModal } from './components/RulesModal';
import { WinModal } from './components/WinModal';
import { sfx } from './game/audio';
import {
  canMove,
  cloneTubes,
  contiguousTopCount,
  generateLevel,
  getColorCountForLevel,
  isBoardWon,
  isTubeSolved,
  solveBoard,
} from './game/solver';
import {
  CAPACITY,
  STORAGE_KEY,
  type PersistedGameState,
  type PlayPhase,
  type WinSummary,
} from './game/types';

function createInitialGameState(): PersistedGameState {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedGameState>;
        if (parsed && Array.isArray(parsed.tubes) && parsed.tubes.length > 0 && parsed.level) {
          const restored: PersistedGameState = {
            level: parsed.level,
            score: parsed.score ?? 0,
            streak: parsed.streak ?? 0,
            extraTubes: parsed.extraTubes ?? 2,
            muted: parsed.muted ?? false,
            symbols: parsed.symbols ?? true,
            tubes: parsed.tubes,
            initialTubes: parsed.initialTubes ?? cloneTubes(parsed.tubes),
            history: parsed.history ?? [],
            moves: parsed.moves ?? 0,
            usedExtraThisLevel: parsed.usedExtraThisLevel ?? false,
            usedUndoThisLevel: parsed.usedUndoThisLevel ?? false,
            isMystery: parsed.isMystery ?? false,
          };

          if (isBoardWon(restored.tubes)) {
            const nextLvl = restored.level + 1;
            const generated = generateLevel(nextLvl);
            return {
              ...restored,
              level: nextLvl,
              isMystery: generated.isMystery,
              tubes: generated.tubes,
              initialTubes: cloneTubes(generated.tubes),
              history: [],
              moves: 0,
              usedExtraThisLevel: false,
              usedUndoThisLevel: false,
            };
          }
          return restored;
        }
      }
    } catch {
      // Fall back to fresh Level 1
    }
  }

  const first = generateLevel(1);
  return {
    level: 1,
    score: 0,
    streak: 0,
    extraTubes: 2,
    muted: false,
    symbols: true,
    tubes: first.tubes,
    initialTubes: cloneTubes(first.tubes),
    history: [],
    moves: 0,
    usedExtraThisLevel: false,
    usedUndoThisLevel: false,
    isMystery: first.isMystery,
  };
}

function getLevelPrompt(lvl: number, isMystery: boolean): string {
  if (isMystery) {
    return 'Mystery level active: hidden gems reveal as you uncover them.';
  }
  if (lvl === 1) {
    return 'Tap a tube to lift a gem, then place it on a matching color or empty tube.';
  }
  return `Level ${lvl} — Group all 4 matching gems into each tube.`;
}

export default function App() {
  const [game, setGame] = useState<PersistedGameState>(createInitialGameState);
  const [phase, setPhase] = useState<PlayPhase>('PLAYING');
  const [selectedTube, setSelectedTube] = useState<number | null>(null);
  const [hintPair, setHintPair] = useState<[number, number] | null>(null);
  const [shakingTube, setShakingTube] = useState<number | null>(null);
  const [lastDropTube, setLastDropTube] = useState<number>(-1);
  const [toast, setToast] = useState<string>(() => getLevelPrompt(game.level, game.isMystery));
  const [winSummary, setWinSummary] = useState<WinSummary | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);

  const fxRef = useRef<ParticleCanvasHandle | null>(null);
  const winTimeoutRef = useRef<number | null>(null);
  const shakeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    sfx.setMuted(game.muted);
  }, [game.muted]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
    } catch {
      // Ignore storage quota issues
    }
  }, [game]);

  useEffect(() => {
    return () => {
      if (winTimeoutRef.current !== null) window.clearTimeout(winTimeoutRef.current);
      if (shakeTimeoutRef.current !== null) window.clearTimeout(shakeTimeoutRef.current);
    };
  }, []);

  const triggerShake = useCallback((idx: number) => {
    setShakingTube(null);
    window.requestAnimationFrame(() => {
      setShakingTube(idx);
      if (shakeTimeoutRef.current !== null) window.clearTimeout(shakeTimeoutRef.current);
      shakeTimeoutRef.current = window.setTimeout(() => setShakingTube(null), 320);
    });
  }, []);

  const startNextLevel = useCallback(() => {
    if (winTimeoutRef.current !== null) {
      window.clearTimeout(winTimeoutRef.current);
      winTimeoutRef.current = null;
    }
    setWinSummary(null);
    setPhase('PLAYING');
    setSelectedTube(null);
    setHintPair(null);
    setLastDropTube(-1);

    setGame((prev) => {
      const nextLvl = prev.level + 1;
      const generated = generateLevel(nextLvl);
      setToast(getLevelPrompt(nextLvl, generated.isMystery));
      return {
        ...prev,
        level: nextLvl,
        isMystery: generated.isMystery,
        tubes: generated.tubes,
        initialTubes: cloneTubes(generated.tubes),
        history: [],
        moves: 0,
        usedExtraThisLevel: false,
        usedUndoThisLevel: false,
      };
    });
  }, []);

  const executeMove = useCallback(
    (fromIdx: number, toIdx: number, targetEl: HTMLButtonElement | null) => {
      const nextTubes = cloneTubes(game.tubes);
      const src = nextTubes[fromIdx];
      const dst = nextTubes[toIdx];
      const moveCount = Math.min(contiguousTopCount(src), CAPACITY - dst.length);
      if (moveCount <= 0) return;

      const movedGems = [];
      for (let i = 0; i < moveCount; i++) {
        const popped = src.pop();
        if (popped) movedGems.push(popped);
      }

      let revealedGem = false;
      if (src.length > 0 && src[src.length - 1].hidden) {
        src[src.length - 1].hidden = false;
        revealedGem = true;
      }

      for (const g of movedGems) dst.push(g);

      const solvedNow = isTubeSolved(dst);
      const boardWon = isBoardWon(nextTubes);

      let newScore = game.score + (solvedNow ? 25 : 0);
      let newStreak = game.streak;
      let newExtraTubes = game.extraTubes;
      let summary: WinSummary | null = null;

      if (solvedNow) {
        sfx.tubeComplete();
        if (targetEl) {
          const r = targetEl.getBoundingClientRect();
          fxRef.current?.spawnBurst(
            r.left + r.width / 2,
            r.top + 48,
            ['#fbbf24', '#34d399', '#38bdf8', '#ffffff'],
            32
          );
        }
      } else {
        sfx.drop(dst.length);
        if (revealedGem) sfx.reveal();
      }

      if (boardWon) {
        newStreak = game.streak + 1;
        const perfectClear = !game.usedUndoThisLevel && !game.usedExtraThisLevel;
        const perfectBonus = perfectClear ? 50 : 0;
        const levelBonus = 50 + game.level * 15 + perfectBonus;
        newScore += levelBonus;

        const earnedExtraTube = game.level % 3 === 0;
        if (earnedExtraTube) {
          newExtraTubes += 1;
        }

        summary = {
          level: game.level,
          moves: game.moves + 1,
          bonus: levelBonus,
          perfectClear,
          earnedExtraTube,
        };
      }

      setGame((prev) => ({
        ...prev,
        tubes: nextTubes,
        history: [...prev.history, { from: fromIdx, to: toIdx, count: moveCount, revealedGem }],
        moves: prev.moves + 1,
        score: newScore,
        streak: newStreak,
        extraTubes: newExtraTubes,
      }));

      setSelectedTube(null);
      setHintPair(null);
      setLastDropTube(toIdx);

      if (summary) {
        setPhase('LEVEL_CLEARED');
        sfx.win();
        fxRef.current?.spawnBurst(
          window.innerWidth * 0.3,
          window.innerHeight * 0.4,
          ['#38bdf8', '#fbbf24', '#f472b6', '#34d399'],
          44
        );
        fxRef.current?.spawnBurst(
          window.innerWidth * 0.7,
          window.innerHeight * 0.4,
          ['#a855f7', '#fbbf24', '#38bdf8', '#ffffff'],
          44
        );
        winTimeoutRef.current = window.setTimeout(() => {
          setWinSummary(summary);
        }, 420);
      }
    },
    [game]
  );

  const handleTubeSelect = useCallback(
    (idx: number, el: HTMLButtonElement | null = null) => {
      if (phase !== 'PLAYING') return;
      setHintPair(null);

      const clicked = game.tubes[idx];
      if (!clicked) return;

      if (selectedTube === null) {
        if (clicked.length === 0 || isTubeSolved(clicked)) {
          triggerShake(idx);
          sfx.invalid();
          return;
        }
        setSelectedTube(idx);
        sfx.pick();
        return;
      }

      if (selectedTube === idx) {
        setSelectedTube(null);
        sfx.drop(0);
        return;
      }

      if (canMove(game.tubes, selectedTube, idx)) {
        executeMove(selectedTube, idx, el);
      } else if (clicked.length > 0 && !isTubeSolved(clicked)) {
        setSelectedTube(idx);
        sfx.pick();
      } else {
        triggerShake(idx);
        sfx.invalid();
      }
    },
    [phase, game.tubes, selectedTube, executeMove, triggerShake]
  );

  const undoMove = useCallback(() => {
    if (phase !== 'PLAYING' || game.history.length === 0) return;

    const nextHistory = [...game.history];
    const last = nextHistory.pop()!;
    const nextTubes = cloneTubes(game.tubes);
    const src = nextTubes[last.from];
    const dst = nextTubes[last.to];

    if (last.revealedGem && src.length > 0) {
      src[src.length - 1].hidden = true;
    }
    for (let i = 0; i < last.count; i++) {
      const popped = dst.pop();
      if (popped) src.push(popped);
    }

    setGame((prev) => ({
      ...prev,
      tubes: nextTubes,
      history: nextHistory,
      moves: Math.max(0, prev.moves - 1),
      usedUndoThisLevel: true,
    }));
    setSelectedTube(null);
    setHintPair(null);
    setLastDropTube(last.from);
    sfx.pick();
  }, [phase, game.history, game.tubes]);

  const showHint = useCallback(() => {
    if (phase !== 'PLAYING') return;
    const raw = game.tubes.map((t) => t.map((g) => g.c));
    const solution = solveBoard(raw, 4000);
    if (solution && solution.length > 0) {
      setHintPair(solution[0]);
      setSelectedTube(null);
      setToast(`Hint: Move from Tube ${solution[0][0] + 1} to Tube ${solution[0][1] + 1}.`);
      sfx.pick();
    } else {
      setToast('No winning path found from here. Try Undo, Restart, or +1 Tube.');
      sfx.invalid();
    }
  }, [phase, game.tubes]);

  const addExtraTube = useCallback(() => {
    if (phase !== 'PLAYING' || game.usedExtraThisLevel || game.extraTubes <= 0) return;
    setGame((prev) => ({
      ...prev,
      extraTubes: prev.extraTubes - 1,
      usedExtraThisLevel: true,
      tubes: [...cloneTubes(prev.tubes), []],
    }));
    setSelectedTube(null);
    setHintPair(null);
    sfx.tubeComplete();
    setToast('Added a temporary empty helper tube.');
  }, [phase, game.usedExtraThisLevel, game.extraTubes]);

  const restartLevel = useCallback(() => {
    if (phase !== 'PLAYING') return;
    setGame((prev) => ({
      ...prev,
      tubes: cloneTubes(prev.initialTubes),
      history: [],
      moves: 0,
      usedExtraThisLevel: false,
      usedUndoThisLevel: true,
    }));
    setSelectedTube(null);
    setHintPair(null);
    setLastDropTube(-1);
    sfx.pick();
    setToast('Level reset to its starting layout.');
  }, [phase]);

  const toggleSound = useCallback(() => {
    setGame((prev) => {
      const nextMuted = !prev.muted;
      sfx.setMuted(nextMuted);
      if (!nextMuted) sfx.pick();
      return { ...prev, muted: nextMuted };
    });
  }, []);

  const toggleSymbols = useCallback(() => {
    sfx.pick();
    setGame((prev) => ({ ...prev, symbols: !prev.symbols }));
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (rulesOpen) return;

      if (winSummary) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startNextLevel();
        }
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'z') {
        e.preventDefault();
        undoMove();
      } else if (key === 'h') {
        e.preventDefault();
        showHint();
      } else if (key === 'r') {
        e.preventDefault();
        restartLevel();
      } else if (key === 'm') {
        e.preventDefault();
        toggleSound();
      } else if (/^[1-9]$/.test(key)) {
        const idx = Number(key) - 1;
        if (idx < game.tubes.length) handleTubeSelect(idx, null);
      } else if (key === '0' && game.tubes.length >= 10) {
        handleTubeSelect(9, null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    rulesOpen,
    winSummary,
    startNextLevel,
    undoMove,
    showHint,
    restartLevel,
    toggleSound,
    game.tubes.length,
    handleTubeSelect,
  ]);

  const colorCount = getColorCountForLevel(game.level);

  return (
    <div className="relative flex min-h-dvh flex-col justify-between px-4 pt-4 pb-5 sm:px-6 sm:pt-5 sm:pb-7">
      <ParticleCanvas ref={fxRef} />

      {/* Header & HUD */}
      <header className="mx-auto w-full max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-3.5">
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 sm:text-2xl">
              CHROMASORT <span className="text-sky-400">∞</span>
            </h1>
            <div className="hidden items-center gap-2 text-xs font-medium text-slate-400 sm:flex">
              <span aria-hidden="true">·</span>
              <span className={game.isMystery ? 'font-semibold text-purple-300' : ''}>
                {game.isMystery ? 'Mystery Stage' : `${colorCount} Colors`}
              </span>
              <span aria-hidden="true">·</span>
              <span>Solver-verified</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleSymbols}
              aria-pressed={game.symbols}
              title="Toggle geometric accessibility symbols"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.06] px-3 py-2 text-xs font-semibold whitespace-nowrap text-slate-100 transition-colors hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 shrink-0"
            >
              <Shapes className="h-4 w-4 text-sky-300" aria-hidden="true" />
              <span>{game.symbols ? 'Symbols On' : 'Symbols Off'}</span>
            </button>

            <button
              type="button"
              onClick={toggleSound}
              aria-pressed={!game.muted}
              title="Toggle sound (M)"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.06] px-3 py-2 text-xs font-semibold whitespace-nowrap text-slate-100 transition-colors hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 shrink-0"
            >
              {game.muted ? (
                <VolumeX className="h-4 w-4 text-slate-400" aria-hidden="true" />
              ) : (
                <Volume2 className="h-4 w-4 text-sky-300" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">{game.muted ? 'Muted' : 'Sound'}</span>
            </button>

            <button
              type="button"
              onClick={() => setRulesOpen(true)}
              aria-label="How to play and shortcuts"
              title="How to Play"
              className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-white/12 bg-white/[0.06] px-2.5 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 shrink-0"
            >
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* 4-Column Tabular Stats Strip */}
        <div className="mt-3.5 grid grid-cols-4 gap-2 sm:gap-3">
          <div className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-center">
            <div className="text-[11px] font-medium text-slate-400">Level</div>
            <div className="mt-0.5 font-mono text-lg font-bold text-sky-400 tabular-nums sm:text-xl">
              {game.level}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-center">
            <div className="text-[11px] font-medium text-slate-400">Moves</div>
            <div className="mt-0.5 font-mono text-lg font-bold text-white tabular-nums sm:text-xl">
              {game.moves}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-center">
            <div className="text-[11px] font-medium text-slate-400">Score</div>
            <div className="mt-0.5 font-mono text-lg font-bold text-white tabular-nums sm:text-xl">
              {game.score.toLocaleString()}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2.5 text-center">
            <div className="text-[11px] font-medium text-slate-400">Streak</div>
            <div className="mt-0.5 inline-flex items-center justify-center gap-1 font-mono text-lg font-bold text-amber-400 tabular-nums sm:text-xl">
              <Flame className="h-4 w-4 fill-amber-400/80 text-amber-300" aria-hidden="true" />
              <span>{game.streak}</span>
            </div>
          </div>
        </div>

        {/* Helper / Live Feedback Line */}
        <p
          role="status"
          aria-live="polite"
          className="mt-3 min-h-[20px] text-center text-xs font-medium text-slate-300 sm:text-sm"
        >
          {toast}
        </p>
      </header>

      {/* Main Puzzle Board */}
      <main className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center py-6 sm:py-8">
        <div className="flex flex-wrap items-end justify-center gap-x-3 gap-y-6 sm:gap-x-5 sm:gap-y-8">
          {game.tubes.map((tube, idx) => (
            <GemTube
              key={idx}
              index={idx}
              tube={tube}
              isSelected={selectedTube === idx}
              isHintFrom={hintPair?.[0] === idx}
              isHintTo={hintPair?.[1] === idx}
              isShaking={shakingTube === idx}
              justDropped={lastDropTube === idx}
              showSymbols={game.symbols}
              onSelect={handleTubeSelect}
            />
          ))}
        </div>
      </main>

      {/* Bottom Controls */}
      <footer className="mx-auto w-full max-w-2xl">
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          <button
            type="button"
            onClick={undoMove}
            disabled={game.history.length === 0 || phase !== 'PLAYING'}
            title="Undo Move (Z)"
            className="flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-xl border border-white/12 bg-white/[0.06] px-2 py-2.5 text-xs font-semibold whitespace-nowrap text-slate-100 transition-all hover:bg-white/12 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 sm:flex-row sm:gap-2 sm:text-sm"
          >
            <Undo2 className="h-4 w-4 text-sky-300" aria-hidden="true" />
            <span>Undo</span>
            <kbd className="hidden rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-slate-300 md:inline">
              Z
            </kbd>
          </button>

          <button
            type="button"
            onClick={showHint}
            disabled={phase !== 'PLAYING'}
            title="Smart Hint (H)"
            className="flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-xl border border-white/12 bg-white/[0.06] px-2 py-2.5 text-xs font-semibold whitespace-nowrap text-slate-100 transition-all hover:bg-white/12 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 sm:flex-row sm:gap-2 sm:text-sm"
          >
            <Lightbulb className="h-4 w-4 text-amber-300" aria-hidden="true" />
            <span>Hint</span>
            <kbd className="hidden rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-slate-300 md:inline">
              H
            </kbd>
          </button>

          <button
            type="button"
            onClick={addExtraTube}
            disabled={game.usedExtraThisLevel || game.extraTubes <= 0 || phase !== 'PLAYING'}
            title="Add Temporary Empty Tube"
            className="relative flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-xl border border-white/12 bg-white/[0.06] px-2 py-2.5 text-xs font-semibold whitespace-nowrap text-slate-100 transition-all hover:bg-white/12 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 sm:flex-row sm:gap-2 sm:text-sm"
          >
            <PlusSquare className="h-4 w-4 text-emerald-300" aria-hidden="true" />
            <span>+1 Tube</span>
            <span className="font-mono text-xs font-bold text-sky-300 tabular-nums">
              ({game.extraTubes})
            </span>
          </button>

          <button
            type="button"
            onClick={restartLevel}
            disabled={phase !== 'PLAYING'}
            title="Restart Level (R)"
            className="flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-xl border border-white/12 bg-white/[0.06] px-2 py-2.5 text-xs font-semibold whitespace-nowrap text-slate-100 transition-all hover:bg-white/12 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 sm:flex-row sm:gap-2 sm:text-sm"
          >
            <RotateCcw className="h-4 w-4 text-slate-300" aria-hidden="true" />
            <span>Restart</span>
            <kbd className="hidden rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-slate-300 md:inline">
              R
            </kbd>
          </button>
        </div>
      </footer>

      <WinModal summary={winSummary} onNextLevel={startNextLevel} />
      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  );
}
