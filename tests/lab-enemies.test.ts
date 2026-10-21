import test from 'node:test';
import assert from 'node:assert/strict';
import { BASE, initPhysics, PEGS, Simulation } from '../src/physics';
import { GameSession } from '../src/game/session';
import { VillainEncounterController } from '../src/lab/experiments/enemies';

test('villain encounter creates one or two safe physical rings atomically for both models', async () => {
  await initPhysics();
  for (const model of ['two-button', 'single-button'] as const) for (const addCount of [1, 2] as const) {
    const session = new GameSession({ scene: 'free', mode: 'classic', model });
    const enemies = new VillainEncounterController(session);
    session.simulation.stableTime = 1.8;
    assert.equal(enemies.request(addCount, 0, `spawn-${addCount}`).accepted, true);
    const result = enemies.beforeStep();
    assert.equal(result?.ok, true);
    assert.equal(result?.spawned.length, addCount);
    assert.equal(session.snapshot().total, 12 + addCount);
    assert.equal(session.snapshot().active, 12 + addCount);
    assert.equal(session.simulation.stableTime, 0);
    assert.equal(new Set(result?.spawned).size, addCount);
    assert.deepEqual([...enemies.extraRingIds], result?.spawned);
    assert.equal(enemies.request(1, 0, `second-${addCount}`).accepted, true);
    assert.equal(enemies.beforeStep()?.reason, 'unsupported-round');
    session.dispose();
  }
});

test('spawn failures cover pause, duplicate, stale round, restart, post-win and unsupported setup', async () => {
  await initPhysics();
  const session = new GameSession({ scene: 'free', mode: 'classic' });
  const enemies = new VillainEncounterController(session);
  assert.equal(enemies.request(1, 0, 'dupe').accepted, true);
  assert.equal(enemies.request(1, 0, 'dupe').reason, 'duplicate');
  assert.equal(enemies.request(2, 0, 'backlog').reason, 'pending');
  session.dispatch({ type: 'pause', reason: 'manual', paused: true });
  assert.equal(enemies.beforeStep()?.reason, 'paused');
  assert.equal(enemies.request(1, 0, 'paused-now').reason, 'paused');
  session.dispatch({ type: 'pause', reason: 'manual', paused: false });
  const oldRound = session.snapshot().roundId;
  session.dispatch({ type: 'restart' });
  assert.equal(enemies.request(1, oldRound, 'stale').reason, 'stale-round');
  assert.equal(enemies.status, undefined);
  assert.equal(enemies.extraRingIds.size, 0);
  assert.equal(enemies.request(1, undefined, 'postwin').accepted, true);
  session.simulation.won = true;
  assert.equal(enemies.beforeStep()?.reason, 'won');
  session.dispose();
});

test('collect objective keeps saved progress and a queued same-boundary spawn prevents stale victory', async () => {
  await initPhysics();
  const session = new GameSession({ scene: 'free', mode: 'collect' });
  const enemies = new VillainEncounterController(session);
  // Deterministic 12/12 completion fixture: collected rings are absent bodies.
  for (const ring of [...session.simulation.rings]) session.simulation.world.removeRigidBody(ring.body);
  session.simulation.rings = [];
  session.simulation.collected = 12;
  assert.equal(session.simulation.rings.length + session.simulation.collected, session.simulation.totalRings);
  assert.equal(enemies.request(2, 0, 'same-tick').accepted, true);
  assert.equal(enemies.beforeStep()?.ok, true);
  session.step();
  const snapshot = session.snapshot();
  assert.equal(snapshot.won, false);
  assert.equal(snapshot.total, 14);
  assert.equal(snapshot.active + snapshot.collected, snapshot.total);
  session.dispose();
});

test('only free 12-ring rounds accept the experimental spawn and dispose cancels requests', async () => {
  await initPhysics();
  const session = new GameSession({ scene: 'drop', mode: 'classic' });
  const enemies = new VillainEncounterController(session);
  assert.equal(enemies.request(2).accepted, true);
  assert.equal(enemies.beforeStep()?.reason, 'unsupported-round');
  session.dispatch({ type: 'restart', scene: 'free' });
  assert.equal(enemies.request(1).accepted, true);
  enemies.dispose();
  assert.equal(enemies.beforeStep(), undefined);
  assert.equal(enemies.request(1).reason, 'disposed');
  assert.equal(enemies.extraRingIds.size, 0);
  session.dispose();
});

test('classic 14-ring capacity fixture can hold seven physical rings on each peg', async () => {
  await initPhysics();
  const simulation = new Simulation();
  simulation.mode = 'classic';
  for (let i = 0; i < 14; i++) {
    simulation.addRing(PEGS[i % 2].x, BASE + .55 + Math.floor(i / 2) * .52, 0);
  }
  for (let i = 0; i < 1200; i++) simulation.step();
  assert.equal(simulation.totalRings, 14);
  assert.equal(simulation.count, 14);
  assert.equal(simulation.escaped, false);
  simulation.dispose();
});

test('explicit lab width, count and peg layout settings isolate villain encounters', async () => {
  await initPhysics();
  for (const layout of [
    { width: 8, ringCount: 12, pegLayout: 'floor' },
    { width: 9, ringCount: 20, pegLayout: 'floor' },
    { width: 9, ringCount: 12, pegLayout: 'raised' },
  ] as const) {
    const session = new GameSession({ scene: 'free', mode: 'classic', lab:layout });
    const startingTotal=session.snapshot().total;
    const enemies = new VillainEncounterController(session);
    assert.equal(enemies.request(1).accepted, true);
    assert.equal(enemies.beforeStep()?.reason, 'unsupported-round');
    assert.equal(session.snapshot().total, startingTotal);
    session.dispose();
  }
});

