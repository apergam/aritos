import type { GameEvent } from '../game/session';

export type AudioStatus = 'unsupported' | 'locked' | 'ready' | 'muted' | 'paused' | 'failed' | 'disposed';

export type AudioControllerOptions = Readonly<{
  enabled?: boolean;
  roundId?: number;
  audioContextFactory?: () => AudioContext;
}>;

/** All effects are synthesized locally; there are no network or preload dependencies. */
export const AUDIO_ASSET_MANIFEST = Object.freeze({
  strategy: 'web-audio-synthesis' as const,
  assets: Object.freeze([] as const),
  preloadRequired: false,
});

type Voice = { nodes: AudioScheduledSourceNode[]; gains: GainNode[] };

/** Owns short, round-scoped effects. Constructing it never creates or starts audio. */
export class AudioController {
  private readonly factory: (() => AudioContext) | undefined;
  private enabled: boolean;
  private paused = false;
  private disposed = false;
  private roundId: number;
  private context: AudioContext | undefined;
  private statusValue: AudioStatus;
  private generation = 0;
  private voices = new Set<Voice>();
  private seenEvents = new WeakSet<object>();
  private collectedRings = new Set<number>();
  private victoryPlayed = false;

  constructor(options: AudioControllerOptions = {}) {
    this.enabled = options.enabled ?? false;
    this.roundId = options.roundId ?? 0;
    this.factory = options.audioContextFactory ?? defaultAudioContextFactory();
    this.statusValue = this.enabled ? (this.factory ? 'locked' : 'unsupported') : 'muted';
  }

  get status(): AudioStatus { return this.statusValue; }

  /** Call directly from a user gesture (for example, start, pump, or sound toggle). */
  async activate(): Promise<boolean> {
    if (this.disposed || !this.enabled || this.paused) return false;
    if (!this.factory) { this.statusValue = 'unsupported'; return false; }
    const generation = ++this.generation;
    try {
      this.context ??= this.factory();
      await this.context.resume();
      if (!this.isCurrent(generation)) {
        if (!this.enabled || this.paused || this.disposed) this.suspendContext();
        return false;
      }
      if (this.context.state !== 'running') {
        this.statusValue = 'failed';
        return false;
      }
      this.statusValue = 'ready';
      return true;
    } catch {
      if (this.isCurrent(generation)) this.statusValue = 'failed';
      return false;
    }
  }

  /** Accepts only events for the current round. No effects are queued while locked or muted. */
  handle(event: GameEvent): void {
    if (this.disposed || event.roundId !== this.roundId || this.seenEvents.has(event)) return;
    this.seenEvents.add(event);
    if (!this.canPlay()) return;
    if (event.type === 'pump') {
      this.playPump();
    } else if (event.type === 'ring-collected') {
      if (this.collectedRings.has(event.ringId)) return;
      this.collectedRings.add(event.ringId);
      this.playWaterDrop();
    } else if (event.type === 'victory' && !this.victoryPlayed) {
      this.victoryPlayed = true;
      this.playCelebration();
    }
  }

  /** Round identity is monotonic in GameSession; older identities are ignored. */
  setRound(roundId: number): void {
    if (!Number.isFinite(roundId) || roundId <= this.roundId || this.disposed) return;
    this.roundId = roundId;
    this.generation++;
    this.stopVoices();
    this.seenEvents = new WeakSet<object>();
    this.collectedRings.clear();
    this.victoryPlayed = false;
    this.refreshStatus();
  }

  setEnabled(enabled: boolean): void {
    if (this.disposed || this.enabled === enabled) return;
    this.enabled = enabled;
    this.generation++;
    if (!enabled) {
      this.stopVoices();
      this.statusValue = 'muted';
      this.suspendContext();
      return;
    }
    this.refreshStatus();
  }

  setPaused(paused: boolean): void {
    if (this.disposed || this.paused === paused) return;
    this.paused = paused;
    this.generation++;
    if (paused) {
      this.stopVoices();
      this.statusValue = 'paused';
      this.suspendContext();
    } else {
      this.refreshStatus();
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.generation++;
    this.stopVoices();
    const context = this.context;
    this.context = undefined;
    this.statusValue = 'disposed';
    if (context) {
      try { void context.close().catch(() => {}); } catch { /* keep teardown safe */ }
    }
  }

  private canPlay(): boolean {
    return this.enabled && !this.paused && !this.disposed && this.statusValue === 'ready' && this.context?.state === 'running';
  }

  private isCurrent(generation: number): boolean {
    return generation === this.generation && this.enabled && !this.paused && !this.disposed;
  }

  private refreshStatus(): void {
    if (this.disposed) this.statusValue = 'disposed';
    else if (!this.enabled) this.statusValue = 'muted';
    else if (this.paused) this.statusValue = 'paused';
    else if (!this.factory) this.statusValue = 'unsupported';
    else if (this.context?.state === 'running') this.statusValue = 'ready';
    else if (this.statusValue !== 'failed') this.statusValue = 'locked';
  }

  private playPump(): void {
    const context = this.context;
    if (!context) return;
    this.voice([
      { frequency: 185, endFrequency: 108, type: 'triangle', start: 0, duration: 0.14, volume: 0.075 },
      { frequency: 610, endFrequency: 390, type: 'sine', start: 0.025, duration: 0.12, volume: 0.027 },
      { frequency: 830, endFrequency: 560, type: 'sine', start: 0.11, duration: 0.13, volume: 0.019 },
    ]);
  }

  private playWaterDrop(): void {
    this.voice([
      { frequency: 520, endFrequency: 760, type: 'sine', start: 0, duration: 0.16, volume: 0.025 },
      { frequency: 390, endFrequency: 310, type: 'sine', start: 0.12, duration: 0.2, volume: 0.018 },
    ]);
  }

  private playCelebration(): void {
    this.voice([
      { frequency: 523.25, endFrequency: 523.25, type: 'sine', start: 0, duration: 0.42, volume: 0.045 },
      { frequency: 659.25, endFrequency: 659.25, type: 'sine', start: 0.035, duration: 0.42, volume: 0.038 },
      { frequency: 783.99, endFrequency: 783.99, type: 'sine', start: 0.07, duration: 0.5, volume: 0.032 },
    ]);
  }

  private voice(notes: readonly { frequency: number; endFrequency: number; type: OscillatorType; start: number; duration: number; volume: number }[]): void {
    const context = this.context;
    if (!context || !this.canPlay()) return;
    const voice: Voice = { nodes: [], gains: [] };
    this.voices.add(voice);
    let endedCount = 0;
    for (const note of notes) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const at = context.currentTime + note.start;
      oscillator.type = note.type;
      oscillator.frequency.setValueAtTime(note.frequency, at);
      oscillator.frequency.exponentialRampToValueAtTime(note.endFrequency, at + note.duration);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(note.volume, at + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + note.duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      voice.nodes.push(oscillator);
      voice.gains.push(gain);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
        endedCount++;
        if (endedCount === voice.nodes.length) this.voices.delete(voice);
      };
      oscillator.start(at);
      oscillator.stop(at + note.duration + 0.01);
    }
  }

  private stopVoices(): void {
    for (const voice of this.voices) {
      for (const gain of voice.gains) {
        try { gain.gain.cancelScheduledValues(0); gain.gain.value = 0; } catch { /* browser may already have ended it */ }
        gain.disconnect();
      }
      for (const node of voice.nodes) {
        node.onended = null;
        try { node.stop(); } catch { /* it may already have ended */ }
        node.disconnect();
      }
    }
    this.voices.clear();
  }

  private suspendContext(): void {
    try { void this.context?.suspend().catch(() => {}); } catch { /* keep lifecycle transitions safe */ }
  }
}

export function createAudioController(options: AudioControllerOptions = {}): AudioController {
  return new AudioController(options);
}

function defaultAudioContextFactory(): (() => AudioContext) | undefined {
  if (typeof window === 'undefined') return undefined;
  const Constructor = window.AudioContext;
  return typeof Constructor === 'function' ? () => new Constructor() : undefined;
}
