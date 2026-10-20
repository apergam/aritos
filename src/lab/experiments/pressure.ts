export type PressureMode = 'fixed' | 'levels' | 'charge' | 'hardware';
export type PressureSide = 'left' | 'right' | 'center';
export type PressureLevel = 0.5 | 1 | 1.5;
export type PressureInputKind = 'pointer' | 'keyboard' | 'assistive';
export type PressurePointerType = 'mouse' | 'pen' | 'touch' | 'unknown';

export interface PressureInput {
  kind: PressureInputKind;
  pointerType?: PressurePointerType;
  pressure?: number;
  timeMs?: number;
}

export interface PressurePulse {
  side: PressureSide;
  intensity: number;
  durationSeconds: 0.24;
  source: 'fixed' | 'level' | 'charge' | 'hardware';
}

interface ActiveGesture {
  side: PressureSide;
  kind: PressureInputKind;
  pointerType: PressurePointerType;
  startedAt: number;
  pressure?: number;
  pressureVaried: boolean;
}

const MIN_INTENSITY = 0.5;
const MAX_INTENSITY = 1.5;
const CHARGE_MS = 900;
const PULSE_SECONDS = 0.24 as const;

/**
 * Deterministic input-to-pump mapping for the pressure lab.
 * begin/move never fire a pump; release emits at most one bounded pulse.
 */
export class PressureGestureController {
  private readonly active = new Map<number, ActiveGesture>();
  private _mode: PressureMode = 'fixed';
  private _level: PressureLevel = 1;
  private paused = false;

  get mode(): PressureMode { return this._mode; }
  get selectedMode(): PressureMode { return this._mode; }
  get level(): PressureLevel { return this._level; }
  get selectedLevel(): PressureLevel { return this._level; }

  setMode(mode: PressureMode): void {
    this._mode = mode;
    this.clear();
  }

  setLevel(level: PressureLevel): void {
    this._level = level;
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) this.clear();
  }

  begin(pointerId: number, side: PressureSide, input: PressureInput): boolean {
    if (this.paused || this.active.has(pointerId)) return false;
    this.active.set(pointerId, {
      side,
      kind: input.kind,
      pointerType: input.pointerType ?? 'unknown',
      startedAt: this.time(input.timeMs),
      pressure: validPressure(input.pressure),
      pressureVaried: false,
    });
    return true;
  }

  move(pointerId: number, input: Pick<PressureInput, 'pressure' | 'timeMs'>): void {
    const gesture = this.active.get(pointerId);
    const pressure = validPressure(input.pressure);
    if (gesture && pressure !== undefined) {
      if (gesture.pressure !== undefined && Math.abs(gesture.pressure - pressure) > 0.02) gesture.pressureVaried = true;
      gesture.pressure = pressure;
    }
  }

  release(pointerId: number, input: Pick<PressureInput, 'pressure' | 'timeMs'> = {}): PressurePulse | null {
    const gesture = this.active.get(pointerId);
    this.active.delete(pointerId);
    if (!gesture || this.paused) return null;

    const releasePressure = validPressure(input.pressure);
    const pressure = releasePressure ?? gesture.pressure;
    if (releasePressure !== undefined && gesture.pressure !== undefined && Math.abs(gesture.pressure - releasePressure) > 0.02) {
      gesture.pressureVaried = true;
    }
    let intensity: number;
    let source: PressurePulse['source'];
    switch (this._mode) {
      case 'fixed':
        intensity = 1;
        source = 'fixed';
        break;
      case 'levels':
        intensity = this._level;
        source = 'level';
        break;
      case 'charge': {
        const elapsed = Math.max(0, this.time(input.timeMs) - gesture.startedAt);
        intensity = MIN_INTENSITY + (MAX_INTENSITY - MIN_INTENSITY) * Math.min(1, elapsed / CHARGE_MS);
        source = 'charge';
        break;
      }
      case 'hardware':
        if (gesture.kind === 'pointer' && (gesture.pointerType === 'pen' || gesture.pointerType === 'touch') && pressure !== undefined && gesture.pressureVaried) {
          intensity = MIN_INTENSITY + pressure * (MAX_INTENSITY - MIN_INTENSITY);
          source = 'hardware';
        } else {
          intensity = this._level;
          source = 'level';
        }
        break;
    }

    return { side: gesture.side, intensity: clampIntensity(intensity), durationSeconds: PULSE_SECONDS, source };
  }

  cancel(pointerId: number): void { this.active.delete(pointerId); }
  clear(): void { this.active.clear(); }
  get activeCount(): number { return this.active.size; }

  private time(value?: number): number {
    return Number.isFinite(value) ? value! : Date.now();
  }
}

function validPressure(value?: number): number | undefined {
  return Number.isFinite(value) && value! > 0 ? clampIntensity(value!, 0, 1) : undefined;
}

export function clampIntensity(value: number, min = MIN_INTENSITY, max = MAX_INTENSITY): number {
  return Math.max(min, Math.min(max, value));
}
