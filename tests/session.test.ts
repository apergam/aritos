import test from 'node:test';
import assert from 'node:assert/strict';
import { GameSession } from '../src/game/session';
import { initPhysics } from '../src/physics';

test('session snapshots are immutable, body-free, and scoped to a round', async () => {
  await initPhysics();
  const session = new GameSession({ scene: 'drop' });
  try {
    const first = session.snapshot();
    assert.equal(first.roundId, 0);
    assert.equal(first.rings.length, 2);
    assert.equal('body' in first.rings[0]!, false);
    assert.equal(Object.isFrozen(first.rings), true);
    assert.deepEqual(first.rings.map(r => r.id), [0, 1]);
    session.startRound();
    const second = session.snapshot();
    assert.equal(second.roundId, first.roundId + 1);
    assert.deepEqual(second.rings.map(r => r.id), [0, 1]);
  } finally { session.dispose(); }
});

test('pause reasons compose and prevent active simulation steps', async () => {
  await initPhysics();
  const session = new GameSession({ scene: 'drop' });
  try {
    session.dispatch({ type: 'pause', reason: 'manual', paused: true });
    session.dispatch({ type: 'pause', reason: 'document-hidden', paused: true });
    session.dispatch({ type: 'pause', reason: 'manual', paused: false });
    assert.deepEqual(session.pauseReasons, ['document-hidden']);
    const before = session.snapshot().activeSeconds;
    session.step();
    assert.equal(session.snapshot().activeSeconds, before);
    session.dispatch({ type: 'pause', reason: 'document-hidden', paused: false });
    session.step();
    assert.ok(session.snapshot().activeSeconds > before);
  } finally { session.dispose(); }
});

test('restart clears settings flow pauses but preserves manual and document-hidden pauses', async () => {
  await initPhysics();
  const session = new GameSession({ scene: 'drop' });
  try {
    const round = session.snapshot().roundId;
    session.dispatch({ type: 'pause', reason: 'menu', paused: true });
    session.dispatch({ type: 'pause', reason: 'restart-confirmation', paused: true });
    session.dispatch({ type: 'pause', reason: 'manual', paused: true });
    session.dispatch({ type: 'pause', reason: 'document-hidden', paused: true });

    // Canceling confirmation only removes its own reason and preserves the round.
    session.dispatch({ type: 'pause', reason: 'restart-confirmation', paused: false });
    assert.equal(session.snapshot().roundId, round);
    assert.deepEqual(session.pauseReasons, ['menu', 'manual', 'document-hidden']);
    session.dispatch({ type: 'restart' });
    assert.equal(session.snapshot().roundId, round + 1);
    assert.deepEqual(session.pauseReasons, ['manual', 'document-hidden']);
    const elapsed = session.snapshot().activeSeconds;
    session.step();
    assert.equal(session.snapshot().activeSeconds, elapsed);
    session.dispatch({ type: 'pause', reason: 'document-hidden', paused: false });
    session.dispatch({ type: 'pause', reason: 'manual', paused: false });
    session.step();
    assert.ok(session.snapshot().activeSeconds > elapsed);
  } finally { session.dispose(); }
});

test('model and mode transitions start fresh rounds; pumps follow the selected model', async () => {
  await initPhysics();
  const session = new GameSession({ scene: 'drop', model: 'single-button', mode: 'classic' });
  const events: string[] = [];
  session.subscribe(event => { if (event.type === 'pump') events.push(event.side); });
  try {
    session.dispatch({ type: 'pump', side: 'left' });
    assert.equal(session.simulation.pulses.length, 0);
    session.dispatch({ type: 'pump', side: 'center' });
    assert.deepEqual(events, ['center']);

    const before = session.snapshot().roundId;
    session.dispatch({ type: 'set-model', model: 'two-button' });
    assert.equal(session.snapshot().roundId, before + 1);
    assert.equal(session.snapshot().model, 'two-button');
    session.dispatch({ type: 'pump', side: 'center' });
    session.dispatch({ type: 'pump', side: 'right' });
    assert.deepEqual(events, ['center', 'right']);

    session.dispatch({ type: 'set-mode', mode: 'collect' });
    assert.equal(session.snapshot().roundId, before + 2);
    assert.equal(session.snapshot().mode, 'collect');
  } finally { session.dispose(); }
});

test('victory is once per round and a reentrant restart suppresses stale listeners/events', async () => {
  await initPhysics();
  const session = new GameSession({ scene: 'drop' });
  const received: string[] = [];
  const originalStep = session.simulation.step.bind(session.simulation);
  session.simulation.step = () => {
    session.simulation.onWin?.();
    session.simulation.onWin?.();
  };
  session.subscribe(event => {
    if (event.type === 'victory') {
      received.push(`first:${event.roundId}`);
      session.startRound({ scene: 'drop' });
    }
  });
  session.subscribe(event => { if (event.type === 'victory') received.push(`second:${event.roundId}`); });
  try {
    session.step();
    assert.deepEqual(received, ['first:0']);
    assert.equal(session.snapshot().roundId, 1);
    // Restore the adapter before teardown; no real physics step was needed here.
    session.simulation.step = originalStep;
  } finally { session.dispose(); }
});

test('equivalent fixed ticks produce the same active time across render schedules', async () => {
  await initPhysics();
  const run = (frames: number[]) => {
    const session = new GameSession({ scene: 'drop' });
    let accumulator = 0;
    const dt = 1 / 120;
    for (const frameSeconds of frames) {
      accumulator += frameSeconds;
      while (accumulator + 1e-10 >= dt) { session.step(); accumulator -= dt; }
    }
    const activeSeconds = session.snapshot().activeSeconds;
    session.dispose();
    return activeSeconds;
  };
  const evenlyScheduled = Array.from({ length: 60 }, () => 1 / 60);
  const unevenWeights = [30, 4, 21, 9, 16, 20, 10, 40, 17, 13, 20, 30, 20, 15, 25, 30, 20, 30, 20, 20, 30, 30, 20, 20, 20, 20, 20, 15];
  const weightTotal = unevenWeights.reduce((a, b) => a + b, 0);
  const unevenlyScheduled = unevenWeights.map(weight => weight / weightTotal);
  assert.ok(Math.abs(evenlyScheduled.reduce((a, b) => a + b, 0) - 1) < 1e-9);
  assert.ok(Math.abs(unevenlyScheduled.reduce((a, b) => a + b, 0) - 1) < 1e-9);
  assert.equal(run(evenlyScheduled), run(unevenlyScheduled));
});
