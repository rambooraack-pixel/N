import { CAPACITY, GEMS, type Tube } from './types';

export function getColorCountForLevel(lvl: number): number {
  if (lvl === 1) return 3;
  if (lvl <= 3) return 4;
  if (lvl <= 6) return 5;
  if (lvl <= 10) return 6;
  if (lvl <= 16) return 7;
  if (lvl <= 24) return 8;
  if (lvl <= 34) return 9;
  if (lvl <= 48) return 10;
  if (lvl <= 65) return 11;
  return 12;
}

function isSolvedTubeRaw(tube: number[]): boolean {
  return tube.length === CAPACITY && tube.every((c) => c === tube[0]);
}

function isWinRaw(tubes: number[][]): boolean {
  return tubes.every((t) => t.length === 0 || isSolvedTubeRaw(t));
}

function contiguousTopRaw(tube: number[]): number {
  if (!tube.length) return 0;
  const top = tube[tube.length - 1];
  let count = 0;
  for (let i = tube.length - 1; i >= 0 && tube[i] === top; i--) {
    count++;
  }
  return count;
}

function isHomogeneousRaw(tube: number[]): boolean {
  return tube.length > 0 && tube.every((c) => c === tube[0]);
}

interface SolverNode {
  tubes: number[][];
  path: [number, number][];
  score: number;
}

/**
 * Fast Best-First Solver using a binary max-heap to guarantee solvability
 * and power smart hints in milliseconds.
 */
export function solveBoard(startTubes: number[][], maxNodes = 3500): [number, number][] | null {
  const canonical = (tubes: number[][]) =>
    tubes
      .map((t) => t.join(','))
      .sort()
      .join('|');

  const scoreState = (tubes: number[][], depth: number) => {
    let s = -depth * 2;
    for (const t of tubes) {
      if (t.length === 0) {
        s += 24;
        continue;
      }
      if (isSolvedTubeRaw(t)) {
        s += 220;
        continue;
      }
      for (let i = 1; i < t.length; i++) {
        if (t[i] === t[i - 1]) s += 16;
      }
    }
    return s;
  };

  const heap: SolverNode[] = [
    {
      tubes: startTubes.map((t) => [...t]),
      path: [],
      score: scoreState(startTubes, 0),
    },
  ];

  const pushHeap = (node: SolverNode) => {
    heap.push(node);
    let idx = heap.length - 1;
    while (idx > 0) {
      const p = (idx - 1) >> 1;
      if (heap[p].score >= heap[idx].score) break;
      [heap[p], heap[idx]] = [heap[idx], heap[p]];
      idx = p;
    }
  };

  const popHeap = (): SolverNode => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      let idx = 0;
      while (true) {
        let best = idx;
        const l = idx * 2 + 1;
        const r = idx * 2 + 2;
        if (l < heap.length && heap[l].score > heap[best].score) best = l;
        if (r < heap.length && heap[r].score > heap[best].score) best = r;
        if (best === idx) break;
        [heap[idx], heap[best]] = [heap[best], heap[idx]];
        idx = best;
      }
    }
    return top;
  };

  const visited = new Set<string>([canonical(startTubes)]);
  let visitedCount = 0;

  while (heap.length && visitedCount < maxNodes) {
    const cur = popHeap();
    visitedCount++;
    if (isWinRaw(cur.tubes)) return cur.path;

    const n = cur.tubes.length;
    let usedEmptyTarget = false;

    for (let i = 0; i < n; i++) {
      const src = cur.tubes[i];
      if (src.length === 0 || isSolvedTubeRaw(src)) continue;
      const topColor = src[src.length - 1];
      const srcHomo = isHomogeneousRaw(src);
      const cnt = contiguousTopRaw(src);

      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const dst = cur.tubes[j];
        if (dst.length >= CAPACITY) continue;

        if (dst.length === 0) {
          if (srcHomo || usedEmptyTarget) continue;
        } else if (dst[dst.length - 1] !== topColor) {
          continue;
        }

        const moveAmt = Math.min(cnt, CAPACITY - dst.length);
        const nextTubes = cur.tubes.map((t) => [...t]);
        for (let k = 0; k < moveAmt; k++) {
          const popped = nextTubes[i].pop();
          if (popped !== undefined) nextTubes[j].push(popped);
        }

        const key = canonical(nextTubes);
        if (visited.has(key)) continue;
        visited.add(key);

        if (dst.length === 0) usedEmptyTarget = true;

        const nextPath = cur.path.concat([[i, j]]);
        pushHeap({
          tubes: nextTubes,
          path: nextPath,
          score: scoreState(nextTubes, nextPath.length),
        });
      }
    }
  }

  return null;
}

export function generateLevel(lvl: number): { isMystery: boolean; tubes: Tube[] } {
  const numColors = getColorCountForLevel(lvl);
  const isMystery = lvl >= 5 && lvl % 5 === 0;
  const emptyCount = 2;

  const palette = Array.from({ length: GEMS.length }, (_, i) => i);
  for (let i = palette.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [palette[i], palette[j]] = [palette[j], palette[i]];
  }
  const activeColors = palette.slice(0, numColors);

  let rawBoard: number[][] | null = null;
  for (let attempt = 0; attempt < 25; attempt++) {
    const pool: number[] = [];
    for (const c of activeColors) {
      for (let k = 0; k < CAPACITY; k++) pool.push(c);
    }
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const candidate: number[][] = [];
    for (let i = 0; i < numColors; i++) {
      candidate.push(pool.slice(i * CAPACITY, (i + 1) * CAPACITY));
    }
    for (let e = 0; e < emptyCount; e++) candidate.push([]);

    if (candidate.some((t) => isSolvedTubeRaw(t))) continue;

    const sol = solveBoard(candidate, 3500);
    if (sol && sol.length >= numColors) {
      rawBoard = candidate;
      break;
    }
  }

  if (!rawBoard) {
    rawBoard = [];
    const pool: number[] = [];
    for (const c of activeColors) {
      for (let k = 0; k < CAPACITY; k++) pool.push(c);
    }
    for (let i = 0; i < numColors; i++) {
      rawBoard.push(pool.slice(i * CAPACITY, (i + 1) * CAPACITY));
    }
    rawBoard.push([], [], []);
  }

  return {
    isMystery,
    tubes: rawBoard.map((t) =>
      t.map((c, idx) => ({
        c,
        hidden: isMystery && idx < t.length - 1,
      }))
    ),
  };
}

export function cloneTubes(tubes: Tube[]): Tube[] {
  return tubes.map((t) => t.map((g) => ({ ...g })));
}

export function isTubeSolved(tube: Tube): boolean {
  return tube.length === CAPACITY && tube.every((g) => !g.hidden && g.c === tube[0].c);
}

export function isBoardWon(tubes: Tube[]): boolean {
  return tubes.every((t) => t.length === 0 || isTubeSolved(t));
}

export function contiguousTopCount(tube: Tube): number {
  if (!tube.length) return 0;
  const top = tube[tube.length - 1];
  if (top.hidden) return 0;
  let count = 0;
  for (let i = tube.length - 1; i >= 0; i--) {
    if (tube[i].hidden || tube[i].c !== top.c) break;
    count++;
  }
  return count;
}

export function canMove(tubes: Tube[], fromIdx: number, toIdx: number): boolean {
  if (fromIdx === toIdx) return false;
  const src = tubes[fromIdx];
  const dst = tubes[toIdx];
  if (!src || !dst) return false;
  if (!src.length || dst.length >= CAPACITY) return false;
  if (src[src.length - 1].hidden) return false;
  if (dst.length === 0) return true;
  return !dst[dst.length - 1].hidden && dst[dst.length - 1].c === src[src.length - 1].c;
}
