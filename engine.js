'use strict';

const PuzzleEngine = (function () {
  const VERSION = 3;
  const CONFIG = {
    hintLimit: 3,
    classic: {
      3: { t3: 90, t2: 150, base: 360 },
      4: { t3: 180, t2: 300, base: 640 },
      5: { t3: 360, t2: 540, base: 1000 }
    },
    slide: {
      3: { t3: 60, t2: 120, base: 400, k: 30 },
      4: { t3: 200, t2: 360, base: 750, k: 80 }
    },
    snapTolerance: 0.35,
    trayScale: 0.72,
    timeBonusRatio: 0.5,
    hintPenaltyRatio: 0.1,
    scoreFloorRatio: 0.5,
    moveThreshold: 10,
    animSnapMs: 150,
    animWinMs: 800
  };

  function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

  function classicShuffle(count) {
    let result;
    let attempts = 0;
    do {
      result = Array.from({ length: count }, (_, i) => i);
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      attempts++;
    } while (attempts <= 10 && fixedRatio(result) > 0.30);
    return { order: result, attempts, failed: attempts > 10 && fixedRatio(result) > 0.30 };
  }

  function fixedRatio(order) {
    const fixed = order.reduce((sum, piece, index) => sum + (piece === index ? 1 : 0), 0);
    return order.length ? fixed / order.length : 0;
  }

  function neighbors(index, grid) {
    const row = Math.floor(index / grid), col = index % grid, result = [];
    if (row > 0) result.push(index - grid);
    if (row < grid - 1) result.push(index + grid);
    if (col > 0) result.push(index - 1);
    if (col < grid - 1) result.push(index + 1);
    return result;
  }

  function slideShuffle(grid, steps) {
    let blank = grid * grid - 1;
    let cells = Array.from({ length: grid * grid }, (_, i) => (i === blank ? null : i));
    let previous = -1;
    for (let step = 0; step < steps; step++) {
      const options = neighbors(blank, grid).filter(i => i !== previous);
      const chosen = options[Math.floor(Math.random() * options.length)];
      cells[blank] = cells[chosen];
      cells[chosen] = null;
      previous = blank;
      blank = chosen;
    }
    return { cells, blank };
  }

  function isSlideSolved(cells) {
    return cells.every((piece, index) => (index === cells.length - 1 ? piece === null : piece === index));
  }

  function slideInversionSolvable(cells, grid) {
    // Small grids are constructed by legal walks; this function is retained for regression tests.
    const flat = cells.filter(v => v !== null);
    let inversions = 0;
    for (let i = 0; i < flat.length; i++) {
      for (let j = i + 1; j < flat.length; j++) if (flat[i] > flat[j]) inversions++;
    }
    if (grid % 2 === 1) return inversions % 2 === 0;
    const blankRowFromBottom = grid - Math.floor(cells.indexOf(null) / grid);
    return (blankRowFromBottom % 2 === 0) ? inversions % 2 === 1 : inversions % 2 === 0;
  }

  function evaluate(mode, grid, elapsedSeconds, hints) {
    const spec = CONFIG[mode][grid];
    const timeStar = elapsedSeconds <= spec.t3 ? 3 : (elapsedSeconds <= spec.t2 ? 2 : 1);
    const hintStar = hints === 0 ? 3 : (hints <= 2 ? 2 : 1);
    const stars = Math.min(timeStar, hintStar);
    const base = spec.base;
    const timeBonus = Math.round(Math.max(0, (spec.t2 - elapsedSeconds) / spec.t2) * base * CONFIG.timeBonusRatio);
    const penalty = Math.round(hints * base * CONFIG.hintPenaltyRatio);
    const score = Math.max(Math.round(base * CONFIG.scoreFloorRatio), Math.round(base + timeBonus - penalty));
    return { stars, base, timeBonus, penalty, score };
  }

  const STORE_PREFIX = 'puzzle-moments';
  function readStore(key, fallback) {
    try {
      const raw = localStorage.getItem(`${STORE_PREFIX}:${key}`);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.v !== VERSION) return fallback;
      return parsed.data;
    } catch (_) { return fallback; }
  }

  function writeStore(key, data) {
    try {
      localStorage.setItem(`${STORE_PREFIX}:${key}`, JSON.stringify({ v: VERSION, data }));
      return true;
    } catch (_) { return false; }
  }

  function removeStore(key) {
    try { localStorage.removeItem(`${STORE_PREFIX}:${key}`); } catch (_) {}
  }

  return {
    CONFIG, VERSION,
    classicShuffle, slideShuffle, isSlideSolved, slideInversionSolvable, neighbors,
    evaluate, readStore, writeStore, removeStore, clamp
  };
})();

if (typeof module !== 'undefined') module.exports = PuzzleEngine;
