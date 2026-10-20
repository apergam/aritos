import assert from 'node:assert/strict';
import test from 'node:test';
import { createAudioController, type AudioControllerOptions } from '../src/audio/audio-controller';
import type { GameEvent } from '../src/game/session';

class FakeParam {
  value = 0;
  setValueAtTime(value: number): void { this.value = value; }
  exponentialRampToValueAtTime(value: number): void { this.value = value; }
  cancelScheduledValues(): void {}
}

class FakeSource {
  frequency = new FakeParam();
  type: OscillatorType = 'sine';
  onended: (() => void) | null = null;
  started = false;
  stopped = false;
  disconnected = false;
  connect(): void {}
  disconnect(): void { this.disconnected = true; }
  start(): void { this.started = true; }
  stop(): void { this.stopped = true; }
}

class FakeGain {
  gain = new FakeParam();
  disconnected = false;
  connect(): void {}
  disconnect(): void { this.disconnected = true; }
}

class FakeContext {
  state: AudioContextState = 'suspended';
  currentTime = 0;
  destination = {} as AudioDestinationNode;
  sources: FakeSource[] = [];
  gains: FakeGain[] = [];
  failResume = false;
  resumeGate: Promise<void> | undefined;
  closed = false;
  async resume(): Promise<void> {
    if (this.failResume) throw new Error('activation denied');
    if (this.resumeGate) await this.resumeGate;
    this.state = 'running';
  }
  async suspend(): Promise<void> { this.state = 'suspended'; }
  async close(): Promise<void> { this.state = 'closed'; this.closed = true; }
  createOscillator(): OscillatorNode {
    const node = new FakeSource(); this.sources.push(node); return node as unknown as OscillatorNode;
  }
  createGain(): GainNode {
    const gain = new FakeGain(); this.gains.push(gain); return gain as unknown as GainNode;
  }
}

function setup(options: Omit<AudioControllerOptions, 'audioContextFactory'> = {}) {
  const contexts: FakeContext[] = [];
  const controller = createAudioController({ ...options, audioContextFactory: () => {
    const context = new FakeContext(); contexts.push(context); return context as unknown as AudioContext;
  } });
  return { controller, contexts };
}

const pump: GameEvent = { type: 'pump', roundId: 0, side: 'left' };

test('restored mute stays silent until explicit activation and effects follow unique current-round events', async () => {
  const { controller, contexts } = setup({ enabled: false, roundId: 0 });
  controller.handle(pump);
  assert.equal(controller.status, 'muted');
  assert.equal(contexts.length, 0, 'constructing or handling while muted creates no audio context');

  controller.setEnabled(true);
  assert.equal(await controller.activate(), true);
  const audiblePump: GameEvent = { type: 'pump', roundId: 0, side: 'left' };
  controller.handle(audiblePump);
  controller.handle(audiblePump);
  assert.equal(contexts[0]?.sources.length, 3, 'the same delivered event cannot replay its effect');

  const victory: GameEvent = { type: 'victory', roundId: 0, mode: 'collect' };
  controller.handle(victory);
  controller.handle({ ...victory });
  assert.equal(contexts[0]?.sources.length, 6, 'victory plays once even if a duplicate is re-created');

  controller.setRound(1);
  controller.handle(audiblePump);
  assert.equal(contexts[0]?.sources.length, 6, 'stale round events are ignored after restart');
  controller.dispose();
});

test('pause, mute, round changes, and disposal stop active voices and preserve the preference', async () => {
  const { controller, contexts } = setup({ enabled: true });
  assert.equal(await controller.activate(), true);
  controller.handle(pump);
  const source = contexts[0]?.sources[0];
  assert.equal(source?.started, true);

  controller.setPaused(true);
  assert.equal(source?.stopped, true);
  assert.equal(controller.status, 'paused');
  controller.setPaused(false);
  assert.equal(controller.status, 'locked');
  assert.equal(await controller.activate(), true);
  controller.handle({ type: 'pump', roundId: 0, side: 'right' });
  const nextSource = contexts[0]?.sources[3];
  controller.setEnabled(false);
  assert.equal(nextSource?.stopped, true);
  assert.equal(controller.status, 'muted');

  controller.setEnabled(true);
  assert.equal(controller.status, 'locked');
  await controller.activate();
  controller.handle({ type: 'pump', roundId: 0, side: 'left' });
  const roundSource = contexts[0]?.sources[6];
  controller.setRound(1);
  assert.equal(roundSource?.stopped, true);
  controller.dispose();
  assert.equal(contexts[0]?.closed, true);
  assert.equal(controller.status, 'disposed');
});

test('unsupported and denied audio activation degrade without affecting event handling', async () => {
  const unsupported = createAudioController({ enabled: true });
  assert.equal(unsupported.status, 'unsupported');
  assert.equal(await unsupported.activate(), false);
  unsupported.handle(pump);
  unsupported.dispose();

  const { controller, contexts } = setup({ enabled: true });
  // The factory is lazy, so configure the context after the user gesture creates it.
  const pending = controller.activate();
  const ctx = contexts[0];
  assert.ok(ctx);
  ctx.failResume = true;
  assert.equal(await pending, true);
  // A subsequent activation can fail; the controller stays usable and silent.
  controller.setPaused(true);
  controller.setPaused(false);
  ctx.failResume = true;
  assert.equal(await controller.activate(), false);
  assert.equal(controller.status, 'failed');
  controller.handle({ type: 'pump', roundId: 0, side: 'left' });
  assert.equal(ctx.sources.length, 0);
  controller.dispose();
});

test('muting while activation is pending prevents late playback and resuspends the context', async () => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const context = new FakeContext();
  context.resumeGate = gate;
  const controller = createAudioController({ enabled: true, audioContextFactory: () => context as unknown as AudioContext });
  const activation = controller.activate();
  controller.setEnabled(false);
  release();
  assert.equal(await activation, false);
  assert.equal(context.state, 'suspended');
  controller.handle(pump);
  assert.equal(context.sources.length, 0);
  controller.dispose();
});
