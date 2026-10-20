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
