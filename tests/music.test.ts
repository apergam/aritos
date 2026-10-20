import assert from 'node:assert/strict';
import test from 'node:test';
import { createMusicController, THEME_MUSIC_MANIFEST } from '../src/audio/theme-music';

class FakeParam {
  value = 0;
  setValueAtTime(value: number): void { this.value = value; }
  linearRampToValueAtTime(value: number): void { this.value = value; }
  cancelScheduledValues(): void {}
}

class FakeGain {
  gain = new FakeParam();
  connect(): void {}
  disconnect(): void {}
}

class FakeBuffer {
  readonly channel: Float32Array;
  constructor(readonly length: number, readonly sampleRate: number) { this.channel = new Float32Array(length); }
  getChannelData(): Float32Array { return this.channel; }
}

class FakeSource {
  buffer: AudioBuffer | null = null;
  loop = false;
  startedAt: number | undefined;
  offset: number | undefined;
  stopped = false;
  disconnected = false;
  onended: (() => void) | null = null;
  connect(): void {}
  start(when = 0, offset = 0): void { this.startedAt = when; this.offset = offset; }
  stop(): void { this.stopped = true; }
  disconnect(): void { this.disconnected = true; }
}

class FakeContext {
  state: AudioContextState = 'suspended';
  currentTime = 0;
  sampleRate = 48_000;
  destination = {} as AudioDestinationNode;
  buffers: FakeBuffer[] = [];
  sources: FakeSource[] = [];
  resumeGate: Promise<void> | undefined;
  failResume = false;
  closed = false;
  async resume(): Promise<void> {
    if (this.failResume) throw new Error('resume denied');
    if (this.resumeGate) await this.resumeGate;
    this.state = 'running';
  }
  async suspend(): Promise<void> { this.state = 'suspended'; }
  async close(): Promise<void> { this.state = 'closed'; this.closed = true; }
  createBuffer(_channels: number, length: number, sampleRate: number): AudioBuffer {
    const buffer = new FakeBuffer(length, sampleRate); this.buffers.push(buffer);
    return buffer as unknown as AudioBuffer;
  }
  createBufferSource(): AudioBufferSourceNode {
    const source = new FakeSource(); this.sources.push(source);
    return source as unknown as AudioBufferSourceNode;
  }
  createGain(): GainNode { return new FakeGain() as unknown as GainNode; }
}

function setup(options: { enabled?: boolean; theme?: 'ocean' | 'space' | 'capybaras' } = {}) {
  const contexts: FakeContext[] = [];
  const controller = createMusicController({ ...options, audioContextFactory: () => {
    const context = new FakeContext(); contexts.push(context); return context as unknown as AudioContext;
  } });
  return { controller, contexts };
}

test('constructor and muted activation are silent; first gesture synthesizes all offline loops once', async () => {
  const { controller, contexts } = setup({ enabled: false });
  assert.equal(controller.status, 'muted');
  assert.equal(contexts.length, 0);
  assert.equal(await controller.activate(), false);
  controller.setEnabled(true);
  assert.equal(contexts.length, 0, 'enabling the preference alone does not start sound');
  assert.equal(await controller.activate(), true);
  const context = contexts[0];
  assert.ok(context);
  assert.equal(context.buffers.length, 3, 'all theme loops are available after one explicit activation');
  assert.equal(context.buffers[0]?.sampleRate, 24_000, 'buffers cap synthesis work and memory at a modest sample rate');
  assert.equal(context.buffers[0]?.length, Math.round(THEME_MUSIC_MANIFEST.tracks.ocean.durationSeconds * 24_000));
  assert.equal(new Set(context.buffers.map(buffer => buffer.length)).size, 3, 'each theme has its own phrase duration');
  assert.equal(context.sources.length, 1);
  assert.equal(context.sources[0]?.loop, true);
  assert.equal(controller.status, 'ready');
  assert.equal(await controller.activate(), true);
  assert.equal(context.sources.length, 1, 'repeated activation while playing does not create another source');
  controller.dispose();
});

test('loops have finite bounded samples, smooth zero seam, and distinct theme scores', async () => {
  const { controller, contexts } = setup({ enabled: true });
  assert.equal(await controller.activate(), true);
  const context = contexts[0];
  assert.ok(context);
  assert.equal(THEME_MUSIC_MANIFEST.bars, 8);
  assert.equal(context.buffers.length, 3);
  const samples = context.buffers.map(buffer => buffer.channel);
  for (const data of samples) {
    assert.ok(data.every(Number.isFinite));
    assert.ok(data.every(value => Math.abs(value) <= 0.8));
    assert.equal(data[0], data.at(-1), 'the buffer meets itself at the same amplitude');
    assert.ok(Math.abs(data[1] - data[0]) < 0.002, 'first sample step remains click-safe');
    assert.ok(Math.abs((data.at(-1) ?? 0) - (data.at(-2) ?? 0)) < 0.002, 'last sample step remains click-safe');
  }
  assert.notDeepEqual(samples[0], samples[1]);
  assert.notDeepEqual(samples[1], samples[2]);
  assert.notDeepEqual(samples[0], samples[2]);
  controller.dispose();
});

test('pause, resume, mute and rapid theme switches retain one source and preserve loop position', async () => {
  const { controller, contexts } = setup({ enabled: true, theme: 'ocean' });
  await controller.activate();
  const context = contexts[0];
  assert.ok(context);
  context.currentTime = 5;
  controller.setTheme('space');
  assert.equal(context.sources.length, 2);
  assert.equal(context.sources[0]?.stopped, true);
  assert.equal(context.sources[1]?.offset, 0, 'a newly chosen theme begins its own phrase');

  context.currentTime = 8;
  controller.setTheme('capybaras');
  controller.setTheme('ocean');
  assert.equal(context.sources.length, 4);
  assert.equal(context.sources[2]?.stopped, true);
  assert.equal(context.sources[3]?.offset, 0, 'another theme replaces the previous phrase');

  context.currentTime = 10;
  controller.setPaused(true);
  assert.equal(context.sources[3]?.stopped, true);
  assert.equal(controller.status, 'paused');
  controller.setPaused(false);
  assert.equal(await controller.activate(), true);
  assert.equal(context.sources.length, 5);
  assert.equal(context.sources[4]?.offset, 2, 'resume continues from the paused position');

  context.currentTime = 12;
  controller.setEnabled(false);
  assert.equal(context.sources[4]?.stopped, true);
  assert.equal(controller.status, 'muted');
  controller.setEnabled(true);
  assert.equal(context.sources.length, 5, 'unmute alone does not start music');
  await controller.activate();
  assert.equal(context.sources.length, 6);
  assert.equal(context.sources[5]?.offset, 4, 'mute retains position for explicit reactivation');
  controller.dispose();
  assert.equal(context.closed, true);
  assert.equal(controller.status, 'disposed');
});

test('unsupported and denied activation fail quietly', async () => {
  const unsupported = createMusicController({ enabled: true, audioContextFactory: undefined });
  assert.equal(await unsupported.activate(), false);
  assert.equal(unsupported.status, 'unsupported');
  unsupported.dispose();

  const { controller, contexts } = setup({ enabled: true });
  const context = new FakeContext(); context.failResume = true;
  // The failed context remains owned for safe retry and teardown.
  const denied = createMusicController({ enabled: true, audioContextFactory: () => context as unknown as AudioContext });
  assert.equal(await denied.activate(), false);
  assert.equal(denied.status, 'failed');
  assert.equal(context.buffers.length, 0);
  denied.dispose();
  controller.dispose();
  assert.equal(contexts.length, 0);
});

test('mute and disposal invalidate a pending activation before any source can start', async () => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const context = new FakeContext(); context.resumeGate = gate;
  const controller = createMusicController({ enabled: true, audioContextFactory: () => context as unknown as AudioContext });
  const activation = controller.activate();
  controller.setEnabled(false);
  release();
  assert.equal(await activation, false);
  assert.equal(context.buffers.length, 0);
  assert.equal(context.sources.length, 0);
  await Promise.resolve();
  assert.equal(context.state, 'suspended');
  controller.dispose();
  assert.equal(context.closed, true);
});


test('settings pause and resume select the buffer for each newly chosen theme', async () => {
  const { controller, contexts } = setup({ enabled: true, theme: 'ocean' });
  await controller.activate();
  const context = contexts[0]!;
  for (const [theme, bufferIndex] of [['space', 1], ['capybaras', 2], ['ocean', 0]] as const) {
    controller.setPaused(true);
    controller.setTheme(theme);
    controller.setPaused(false);
    await controller.activate();
    assert.equal(context.sources.at(-1)?.buffer, context.buffers[bufferIndex], 'resuming settings must play the selected theme');
    assert.equal(context.sources.filter(source => !source.stopped).length, 1);
  }
  controller.dispose();
});

test('theme openings do not reuse the same normalized sample pattern', async () => {
  const { controller, contexts } = setup({ enabled: true });
  await controller.activate();
  const buffers = contexts[0]!.buffers;
  const length = Math.floor(buffers[0]!.sampleRate * 0.25);
  for (let a = 0; a < buffers.length; a++) for (let b = a + 1; b < buffers.length; b++) {
    let dot = 0, energyA = 0, energyB = 0;
    for (let i = 0; i < length; i++) {
      const x = buffers[a]!.channel[i]!, y = buffers[b]!.channel[i]!;
      dot += x * y; energyA += x * x; energyB += y * y;
    }
    const similarity = Math.abs(dot / Math.sqrt(energyA * energyB));
    assert.ok(similarity < 0.95, `theme ${a}/${b} opening similarity ${similarity.toFixed(4)} must be below 0.95`);
  }
  controller.dispose();
});
