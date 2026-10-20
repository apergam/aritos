import type { ThemeId } from '../themes/types';

export type MusicStatus = 'unsupported' | 'locked' | 'ready' | 'muted' | 'paused' | 'failed' | 'disposed';

export type MusicControllerOptions = Readonly<{
  enabled?: boolean;
  theme?: ThemeId;
  audioContextFactory?: () => AudioContext;
}>;

const BPM = 100;
const BEATS_PER_BAR = 4;
const BARS = 8;
const LOOP_SECONDS = BARS * BEATS_PER_BAR * 60 / BPM;
const OUTPUT_GAIN = 0.075;
const EDGE_FADE_SECONDS = 0.025;

type Score = Readonly<{ melody: readonly number[]; bass: readonly number[]; chord: readonly number[]; step: number }>;

// Original, project-authored note patterns. Equal temperament pitches use A4=440 Hz.
// The loop is 8 bars at 100 BPM (19.2 seconds); the repeated harmony resolves at its seam.
const SCORES: Readonly<Record<ThemeId, Score>> = Object.freeze({
  ocean: Object.freeze({
    melody: Object.freeze([0, 7, 4, 2, 9, 7, 4, 2, 0, 7, 11, 9, 7, 4, 2, 4, 0, 7, 4, 2, 9, 7, 4, 2, 0, 7, 11, 9, 7, 4, 2, 0]),
    bass: Object.freeze([0, 0, 5, 5, 3, 3, 5, 5]), chord: Object.freeze([0, 5, 3, 5]), step: 0.5,
  }),
  space: Object.freeze({
    melody: Object.freeze([0, 4, 7, 11, 14, 11, 7, 4, 2, 5, 9, 14, 16, 14, 9, 5, 0, 4, 7, 11, 14, 11, 7, 4, 2, 5, 9, 14, 16, 14, 9, 5]),
    bass: Object.freeze([0, 0, 2, 2, 5, 5, 2, 2]), chord: Object.freeze([0, 2, 5, 2]), step: 0.5,
  }),
  capybaras: Object.freeze({
    melody: Object.freeze([0, 3, 7, 10, 7, 3, 5, 7, 0, 3, 7, 12, 10, 7, 5, 3, 0, 3, 7, 10, 7, 3, 5, 7, 0, 3, 7, 12, 10, 7, 3, 0]),
    bass: Object.freeze([0, 0, 3, 3, 5, 5, 3, 3]), chord: Object.freeze([0, 3, 5, 3]), step: 0.25,
  }),
});

/** Synthesized local loops. No audio files, remote requests, or third-party material are used. */
export const THEME_MUSIC_MANIFEST = Object.freeze({
  strategy: 'procedural-web-audio-buffer' as const,
  themes: Object.freeze(['ocean', 'space', 'capybaras'] as const),
  preloadRequired: false,
  bars: BARS,
  bpm: BPM,
  durationSeconds: LOOP_SECONDS,
  source: 'Original note scores and waveform synthesis in src/audio/theme-music.ts; no external recording or license dependency.',
});

/** Owns one finite looping buffer source. Construction is silent and creates no context. */
export class MusicController {
  private readonly factory: (() => AudioContext) | undefined;
  private enabled: boolean;
  private theme: ThemeId;
  private paused = false;
  private disposed = false;
  private context: AudioContext | undefined;
  private gain: GainNode | undefined;
  private source: AudioBufferSourceNode | undefined;
  private buffers: Partial<Record<ThemeId, AudioBuffer>> = {};
  private statusValue: MusicStatus;
  private generation = 0;
  private offset = 0;
  private sourceStartedAt = 0;

  constructor(options: MusicControllerOptions = {}) {
    this.enabled = options.enabled ?? false;
    this.theme = options.theme ?? 'ocean';
    this.factory = options.audioContextFactory ?? defaultAudioContextFactory();
    this.statusValue = this.enabled ? (this.factory ? 'locked' : 'unsupported') : 'muted';
  }

  get status(): MusicStatus { return this.statusValue; }

  /** Call directly from an explicit user gesture. All three buffers are prepared offline here. */
  async activate(): Promise<boolean> {
    if (this.disposed || !this.enabled || this.paused) return false;
    if (!this.factory) { this.statusValue = 'unsupported'; return false; }
    if (this.statusValue === 'ready' && this.context?.state === 'running' && this.source) return true;
    const generation = ++this.generation;
    try {
      this.context ??= this.factory();
      await this.context.resume();
      if (!this.isCurrent(generation)) {
        if (!this.enabled || this.paused || this.disposed) this.suspendContext();
        return false;
      }
      if (this.context.state !== 'running') { this.statusValue = 'failed'; return false; }
      this.prepareBuffers();
      this.startSource(this.theme, this.offset);
      this.statusValue = 'ready';
      return true;
    } catch {
      if (this.isCurrent(generation)) {
        this.statusValue = 'failed';
        this.stopSource();
        this.suspendContext();
      }
      return false;
    }
  }

  setEnabled(enabled: boolean): void {
    if (this.disposed || this.enabled === enabled) return;
    this.enabled = enabled;
    this.generation++;
    if (!enabled) {
      this.captureOffset();
      this.stopSource();
      this.statusValue = 'muted';
      this.suspendContext();
    } else this.refreshStatus();
  }

  setTheme(theme: ThemeId): void {
    if (this.disposed || !isTheme(theme) || this.theme === theme) return;
    this.captureOffset();
    this.theme = theme;
    if (this.enabled && !this.paused && this.context?.state === 'running' && this.statusValue === 'ready') {
      this.startSource(theme, this.offset);
    }
  }

  setPaused(paused: boolean): void {
    if (this.disposed || this.paused === paused) return;
    this.paused = paused;
    this.generation++;
    if (paused) {
      this.captureOffset();
      this.stopSource();
      this.statusValue = 'paused';
      this.suspendContext();
    } else this.refreshStatus();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.generation++;
    this.stopSource();
    this.buffers = {};
    const context = this.context;
    this.context = undefined;
    this.gain = undefined;
    this.statusValue = 'disposed';
    if (context) {
      try { void context.close().catch(() => {}); } catch { /* teardown must remain safe */ }
    }
  }

  private prepareBuffers(): void {
    const context = this.context;
    if (!context || Object.keys(this.buffers).length === 3) return;
    for (const theme of THEME_MUSIC_MANIFEST.themes) this.buffers[theme] = synthesizeLoop(context, SCORES[theme]);
  }

  private startSource(theme: ThemeId, offset: number): void {
    const context = this.context;
    const buffer = this.buffers[theme];
    if (!context || !buffer || context.state !== 'running') return;
    this.stopSource();
    if (!this.gain) {
      this.gain = context.createGain();
      this.gain.gain.value = OUTPUT_GAIN;
      this.gain.connect(context.destination);
    }
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(this.gain);
    this.source = source;
    this.offset = wrap(offset, LOOP_SECONDS);
    this.sourceStartedAt = context.currentTime;
    source.start(0, this.offset);
  }

  private captureOffset(): void {
    if (this.source && this.context) this.offset = wrap(this.offset + this.context.currentTime - this.sourceStartedAt, LOOP_SECONDS);
  }

  private stopSource(): void {
    const source = this.source;
    this.source = undefined;
    if (!source) return;
    source.onended = null;
    try { source.stop(); } catch { /* may already have ended */ }
    try { source.disconnect(); } catch { /* browser may already have disconnected it */ }
  }

  private isCurrent(generation: number): boolean {
    return generation === this.generation && this.enabled && !this.paused && !this.disposed;
  }

  private refreshStatus(): void {
    if (this.disposed) this.statusValue = 'disposed';
    else if (!this.enabled) this.statusValue = 'muted';
    else if (this.paused) this.statusValue = 'paused';
    else if (!this.factory) this.statusValue = 'unsupported';
    else if (this.statusValue !== 'failed') this.statusValue = this.context?.state === 'running' ? 'ready' : 'locked';
  }

  private suspendContext(): void {
    try { void this.context?.suspend().catch(() => {}); } catch { /* lifecycle transition remains safe */ }
  }
}

export function createMusicController(options: MusicControllerOptions = {}): MusicController {
  return new MusicController(options);
}

function synthesizeLoop(context: AudioContext, score: Score): AudioBuffer {
  // A 24 kHz mono buffer holds the three themes in roughly 5.3 MB at 19.2 s each,
  // while retaining enough bandwidth for the synthesized melody and bell partials.
  const sampleRate = Math.min(context.sampleRate || 44_100, 24_000);
  const frameCount = Math.round(LOOP_SECONDS * sampleRate);
  const buffer = context.createBuffer(1, frameCount, sampleRate);
  const samples = buffer.getChannelData(0);
  const beatSeconds = 60 / BPM;
  for (let frame = 0; frame < frameCount; frame++) {
    const time = frame / sampleRate;
    const beat = time / beatSeconds;
    let value = 0;
    const melodyPosition = beat / score.step;
    const melodyIndex = Math.floor(melodyPosition);
    const melodyFraction = melodyPosition - melodyIndex;
    const melodyPitch = score.melody[melodyIndex % score.melody.length] ?? 0;
    const melodyHz = midiFrequency(60 + melodyPitch);
    const melodyEnv = pluckEnvelope(melodyFraction, score.step);
    value += score.step === 0.25
      ? Math.sin(2 * Math.PI * melodyHz * time) * melodyEnv * 0.14
      : bell(melodyHz, time) * melodyEnv * 0.13;

    const beatInBar = beat % BEATS_PER_BAR;
    const barRelease = boundaryRelease(beatInBar, BEATS_PER_BAR, 0.08);
    const chord = score.chord[Math.floor(beat / BEATS_PER_BAR) % score.chord.length] ?? 0;
    const chordHz = midiFrequency(48 + chord);
    value += (Math.sin(2 * Math.PI * chordHz * time) + 0.35 * Math.sin(4 * Math.PI * chordHz * time)) * (0.035 + 0.018 * Math.sin(2 * Math.PI * beatInBar / BEATS_PER_BAR)) * 0.42 * barRelease;

    const bassNote = score.bass[Math.floor(beat / BEATS_PER_BAR) % score.bass.length] ?? 0;
    const bassHz = midiFrequency(36 + bassNote);
    value += Math.sin(2 * Math.PI * bassHz * time) * (0.05 + 0.025 * Math.sin(2 * Math.PI * beatInBar / BEATS_PER_BAR)) * 0.38 * barRelease;

    const edge = Math.min(1, time / EDGE_FADE_SECONDS, (LOOP_SECONDS - time) / EDGE_FADE_SECONDS);
    // This short cosine fade makes the finite buffer meet itself at zero amplitude.
    const smoothEdge = edge <= 0 ? 0 : 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, edge));
    samples[frame] = Math.max(-0.8, Math.min(0.8, value * smoothEdge));
  }
  // Keep the tail at the same exact value as the first sample; periodic playback cannot click.
  samples[frameCount - 1] = samples[0] ?? 0;
  return buffer;
}

function pluckEnvelope(fraction: number, step: number): number {
  const decay = Math.exp(-fraction * (step === 0.25 ? 7 : 3.8));
  const attack = Math.min(1, fraction * 28);
  const release = boundaryRelease(fraction, 1, 0.12);
  return decay * attack * release;
}

function boundaryRelease(position: number, period: number, fadeWidth: number): number {
  const distance = Math.min(position, period - position);
  const progress = Math.max(0, Math.min(1, distance / fadeWidth));
  return 0.5 - 0.5 * Math.cos(Math.PI * progress);
}

function bell(frequency: number, time: number): number {
  const phase = 2 * Math.PI * frequency * time;
  return (Math.sin(phase) + 0.42 * Math.sin(phase * 2.756) + 0.2 * Math.sin(phase * 5.404)) / 1.62;
}

function midiFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

function wrap(value: number, duration: number): number {
  return ((value % duration) + duration) % duration;
}

function isTheme(theme: string): theme is ThemeId {
  return theme === 'ocean' || theme === 'space' || theme === 'capybaras';
}

function defaultAudioContextFactory(): (() => AudioContext) | undefined {
  if (typeof window === 'undefined') return undefined;
  const Constructor = window.AudioContext;
  return typeof Constructor === 'function' ? () => new Constructor() : undefined;
}
