import test from 'node:test';
import assert from 'node:assert/strict';
import { initPhysics, type Vec } from '../src/physics';
import { GameSession } from '../src/game/session';
import { VillainEncounterController } from '../src/lab/experiments/enemies';
import { PLAYER_TOY_SETTINGS } from '../src/models/selected-toy';

const layouts = [
  { width: 9, ringCount: 12, pegLayout: 'floor' },
  PLAYER_TOY_SETTINGS,
] as const;

test('blocked first lane still spawns clear of every peg and cannot grant progress during free fall', async () => {
  await initPhysics();
  for (const lab of layouts) {
    const session = new GameSession({ scene: 'free', mode: 'collect', lab });
    try {
      const simulation = session.simulation;
      const blocker = simulation.rings[0];
      for (const ring of simulation.rings.slice(1)) simulation.world.removeRigidBody(ring.body);
      simulation.rings = [blocker];
      simulation.collected = 11;
      blocker.body.setTranslation({ x: -3.55, y: 4.75, z: 0 } satisfies Vec, true);

      const enemies = new VillainEncounterController(session);
      assert.equal(enemies.request(1, session.snapshot().roundId, `landing-${lab.width}-${lab.pegLayout}`).accepted, true);
      const result = enemies.beforeStep();
      assert.equal(result?.ok, true);
      const spawnedId = result!.spawned[0];
      const spawned = simulation.rings.find(ring => ring.id === spawnedId)!;
      const origin = spawned.body.translation();
      const radius = .52 + .13;
      const overlapsPegCatchment = simulation.layout.pegs.some(peg =>
        Math.hypot(origin.x - peg.x, origin.z - peg.z) < radius + .11 + .1);

      for (let i = 0; i < 1200; i++) session.step();
      assert.deepEqual({ layout: `${lab.width}/${lab.pegLayout}`, overlapsPegCatchment, collected: simulation.collected, won: simulation.won },
        { layout: `${lab.width}/${lab.pegLayout}`, overlapsPegCatchment: false, collected: 11, won: false },
        `spawn ${spawnedId} should clear every peg shaft and must not grant progress during an unforced fall`);
    } finally { session.dispose(); }
  }
});

test('one and two enemy rings succeed atomically for both approved layouts', async () => {
  await initPhysics();
  for (const lab of layouts) for (const addCount of [1, 2] as const) {
    const session = new GameSession({ scene: 'free', mode: 'collect', lab });
    try {
      const enemies = new VillainEncounterController(session);
      assert.equal(enemies.request(addCount, session.snapshot().roundId, `count-${lab.width}-${addCount}`).accepted, true);
      const result = enemies.beforeStep();
      assert.equal(result?.ok, true, `${lab.width}/${lab.pegLayout} +${addCount}: ${result?.reason ?? 'failed'}`);
      assert.equal(result?.spawned.length, addCount);
      const snapshot = session.snapshot();
      assert.equal(snapshot.total, 12 + addCount);
      assert.equal(snapshot.active + snapshot.collected, snapshot.total);
      assert.equal(new Set(result?.spawned).size, addCount);
    } finally { session.dispose(); }
  }
});

test('a blocked second safe pose rejects +2 without changing bodies or objective', async () => {
  await initPhysics();
  for (const lab of layouts) {
    const session = new GameSession({ scene: 'free', mode: 'classic', lab });
    try {
      const simulation = session.simulation, radius = .52 + .13;
      const side = simulation.layout.tank.x - radius - .1;
      const high = Math.max(...simulation.layout.pegs.map(peg => peg.tipY)) + .35;
      for (const [i, x] of [-side, 0, side].entries()) {
        simulation.rings[i].body.setTranslation({ x, y: high, z: 0 }, true);
      }
      const enemies = new VillainEncounterController(session);
      assert.equal(enemies.request(2).accepted, true);
      assert.equal(enemies.beforeStep()?.reason, 'no-safe-space');
      assert.equal(session.snapshot().total, 12);
      assert.equal(session.snapshot().active, 12);
    } finally { session.dispose(); }
  }
});

test('tilted gravity rejects a +2 encounter when fewer than two clear fall paths remain', async () => {
  await initPhysics();
  for (const lab of layouts) {
    const session = new GameSession({ scene: 'free', mode: 'classic', lab });
    try {
      session.simulation.setGravity({ x: lab.width === 9 ? .4 : .5, y: -1, z: 0 });
      const enemies = new VillainEncounterController(session);
      assert.equal(enemies.request(2).accepted, true);
      assert.equal(enemies.beforeStep()?.reason, 'no-safe-space');
      assert.equal(session.snapshot().total, 12);
      assert.equal(session.snapshot().active, 12);
    } finally { session.dispose(); }
  }
});

test('enemy spawn rejects a tilted free-fall path that exits the tank and would bounce off its wall', async () => {
  await initPhysics();
  const session = new GameSession({ scene: 'free', mode: 'classic', lab: { width: 9, ringCount: 12, pegLayout: 'floor' } });
  try {
    session.simulation.setGravity({ x: 3, y: -1, z: 0 });
    const enemies = new VillainEncounterController(session);
    assert.equal(enemies.request(1).accepted, true);
    assert.equal(enemies.beforeStep()?.reason, 'no-safe-space');
    assert.equal(session.snapshot().total, 12);
    assert.equal(session.snapshot().active, 12);
  } finally { session.dispose(); }
});
