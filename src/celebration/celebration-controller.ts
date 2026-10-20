import type { GameEvent } from '../game/session';
import { theme, type ThemeId } from '../themes';

export type CelebrationQuality = 'high' | 'reduced';
export type CelebrationTimer = Readonly<{
  now(): number;
  setTimeout(callback: () => void, delayMs: number): unknown;
  clearTimeout(handle: unknown): void;
}>;
export type CelebrationOptions = Readonly<{
  theme: ThemeId;
  roundId: number;
  quality?: CelebrationQuality;
  /** Timer seam for deterministic lifecycle verification. */
  timer?: CelebrationTimer;
}>;
export type CelebrationController = Readonly<{
  handle(event: GameEvent): void;
  setRound(roundId: number): void;
  setTheme(theme: ThemeId): void;
  setQuality(quality: CelebrationQuality): void;
  setPaused(paused: boolean): void;
  dispose(): void;
}>;

const DURATION_MS = 4_000;
const defaultTimer: CelebrationTimer = {
  now: () => Date.now(),
  setTimeout: (callback, delay) => globalThis.setTimeout(callback, delay),
  clearTimeout: handle => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
};

/**
 * Owns a short, non-interactive celebration layer. Put the host over the toy
 * stage; the layer never captures input and is hidden when no effect is active.
 */
export function createCelebration(container: HTMLElement, options: CelebrationOptions): CelebrationController {
  const doc = container.ownerDocument;
  const layer = doc.createElement('div');
  layer.className = 'aritos-celebration';
  layer.setAttribute('aria-hidden', 'true');
  layer.dataset.state = 'idle';

  const mascot = doc.createElement('img');
  mascot.className = 'aritos-celebration__mascot';
  mascot.alt = '';
  mascot.draggable = false;
  layer.appendChild(mascot);

  const confetti = doc.createElement('div');
  confetti.className = 'aritos-celebration__confetti';
  layer.appendChild(confetti);
  container.appendChild(layer);

  const timer = options.timer ?? defaultTimer;
  let currentTheme = options.theme;
  let currentRound = options.roundId;
  let quality = options.quality ?? 'high';
  let paused = false;
  let disposed = false;
  let celebratedRound: number | undefined;
  let generation = 0;
  let timeout: unknown;
  let expiresAt = 0;
  let remainingMs = DURATION_MS;
  let motionQuery: MediaQueryList | undefined;

  const makeConfetti = () => {
    confetti.replaceChildren();
    if (motionQuery?.matches) return;
    const colors = theme(currentTheme).colors.rings;
    const count = quality === 'high' ? 24 : 10;
    for (let i = 0; i < count; i++) {
      const piece = doc.createElement('i');
      piece.style.setProperty('--piece-color', `#${colors[i % colors.length]!.toString(16).padStart(6, '0')}`);
      // Spread particles around the outside so the rings stay easy to read.
      const side = i % 4;
      const lane = Math.floor(i / 4) / Math.ceil(count / 4);
      piece.style.setProperty('--piece-lane', `${Math.round(8 + lane * 84)}%`);
      piece.style.setProperty('--piece-delay', `${(i % 7) * -0.13}s`);
      piece.dataset.edge = ['top', 'right', 'bottom', 'left'][side]!;
      confetti.appendChild(piece);
    }
  };

  const updateAppearance = () => {
    mascot.src = theme(currentTheme).assets.mascot.source;
    mascot.dataset.mascot = theme(currentTheme).mascot;
    makeConfetti();
  };

  const clearExpiry = () => {
    if (timeout !== undefined) timer.clearTimeout(timeout);
    timeout = undefined;
  };

  const finish = (token: number) => {
    if (disposed || token !== generation || currentRound !== celebratedRound) return;
    timeout = undefined;
    remainingMs = DURATION_MS;
    layer.dataset.state = 'idle';
  };

  const scheduleExpiry = () => {
    const token = generation;
    expiresAt = timer.now() + remainingMs;
    timeout = timer.setTimeout(() => finish(token), remainingMs);
  };

  const clearEffect = () => {
    generation++;
    clearExpiry();
    remainingMs = DURATION_MS;
    layer.dataset.state = 'idle';
    layer.classList.remove('is-paused');
  };

  const onMotionPreference = () => {
    if (motionQuery?.matches) layer.dataset.reducedMotion = 'true';
    else delete layer.dataset.reducedMotion;
    makeConfetti();
  };

  updateAppearance();
  if (typeof globalThis.matchMedia === 'function') {
    motionQuery = globalThis.matchMedia('(prefers-reduced-motion: reduce)');
    onMotionPreference();
    motionQuery.addEventListener?.('change', onMotionPreference);
  }

  return {
    handle(event) {
      if (disposed || event.type !== 'victory' || event.roundId !== currentRound || celebratedRound === currentRound) return;
      celebratedRound = currentRound;
      remainingMs = DURATION_MS;
      layer.dataset.state = 'active';
      if (paused) layer.classList.add('is-paused');
      if (!paused) scheduleExpiry();
    },
    setRound(roundId) {
      if (disposed || roundId === currentRound) return;
      clearEffect();
      currentRound = roundId;
      celebratedRound = undefined;
    },
    setTheme(id) {
      if (disposed || id === currentTheme) return;
      currentTheme = id;
      updateAppearance();
    },
    setQuality(value) {
      if (disposed || value === quality) return;
      quality = value;
      makeConfetti();
    },
    setPaused(value) {
      if (disposed || value === paused) return;
      paused = value;
      if (layer.dataset.state !== 'active') return;
      if (paused) {
        remainingMs = Math.max(0, expiresAt - timer.now());
        clearExpiry();
        layer.classList.add('is-paused');
      } else {
        layer.classList.remove('is-paused');
        if (remainingMs <= 0) finish(generation);
        else scheduleExpiry();
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      generation++;
      clearExpiry();
      motionQuery?.removeEventListener?.('change', onMotionPreference);
      layer.remove();
    },
  };
}

export const CELEBRATION_DURATION_MS = DURATION_MS;
