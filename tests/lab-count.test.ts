import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initPhysics, Simulation, DT, RING, TANK, BASE, TIP } from '../src/physics.ts';
import { freeStartPoses, stackSpacing, stackStartPoses } from '../src/lab/experiments/count.ts';

await initPhysics();
const run = (simulation: Simulation, seconds: number) => {
  for (let step = 0; step < seconds / DT; step++) simulation.step();
};
test('count layouts preserve the twelve-ring starts and place twenty within the tank', () => {
  for (const count of [12, 20] as const) {
    const poses = freeStartPoses(count);
    assert.equal(poses.length, count);
    for (const pose of poses) {
      assert.ok(Math.abs(pose.x) + RING.radius + RING.tube <= TANK.x);
      assert.ok(Math.abs(pose.z) + RING.radius + RING.tube <= TANK.z);
      assert.ok(pose.y + RING.radius + RING.tube < TANK.y);
    }
    for (let a = 0; a < poses.length; a++) for (let b = a + 1; b < poses.length; b++) {
      const distance = Math.hypot(poses[a].x - poses[b].x, poses[a].y - poses[b].y, poses[a].z - poses[b].z);
      assert.ok(distance >= RING.radius * 2 - 1e-9, `initial centers overlap for ${count}: ${a}/${b}`);
    }
  }
  assert.equal(stackSpacing(12), 0.55);
  assert.equal(stackSpacing(20), 0.35);
});

test('stack layouts preserve twelve-ring heights and keep twenty below each peg tip', () => {
  const oldTwelve = stackStartPoses(12);
  assert.deepEqual(oldTwelve.slice(0, 4), [
    { x: -1.7, y: BASE + 0.6, z: 0 },
    { x: 1.7, y: BASE + 0.6, z: 0 },
    { x: -1.7, y: BASE + 1.15, z: 0 },
    { x: 1.7, y: BASE + 1.15, z: 0 },
  ]);
  for (const count of [12, 20] as const) {
    const poses = stackStartPoses(count);
    assert.equal(poses.length, count);
    assert.ok(poses.at(-1)!.y + RING.tube <= TIP);
  }
  assert.throws(() => stackStartPoses(20, []), /At least one peg/);
  assert.throws(() => stackStartPoses(20, [{ x: 0, z: 0, baseY: 0, tipY: 1 }]), /exceeds its peg tip/);
});

test('twenty-ring free rounds initialize and restart with a stable objective and valid positions', () => {
  const simulation = new Simulation({ ringCount: 20 });
  try {
    for (let round = 0; round < 2; round++) {
      simulation.reset('free', { ringCount: 20 });
      assert.equal(simulation.totalRings, 20);
      assert.equal(simulation.rings.length, 20);
      assert.equal(simulation.world.bodies.len(), 20);
      for (const ring of simulation.rings) {
        const p = ring.body.translation();
        assert.ok(Math.abs(p.x) + RING.radius + RING.tube <= simulation.layout.tank.x);
        assert.ok(Math.abs(p.z) + RING.radius + RING.tube <= simulation.layout.tank.z);
      }
    }
  } finally { simulation.dispose(); }
});

test('twenty physical rings stack on both toy models and extract under inversion', () => {
  for (const model of [1, 2]) {
    const simulation = new Simulation({ ringCount: 20 });
    try {
      simulation.model = model;
      simulation.reset('stack', { ringCount: 20 });
      run(simulation, 10);
      assert.equal(simulation.count, 20, `model ${model}: rings did not settle threaded`);
      assert.equal(simulation.won, true, `model ${model}: classic victory did not fire`);
      assert.equal(simulation.rings.length, 20);
      assert.equal(simulation.escaped, false);

      simulation.setGravity({ x: 0, y: 3, z: 0 });
      run(simulation, 10);
      assert.equal(simulation.count, 0, `model ${model}: inversion did not extract the stack`);
      assert.equal(simulation.rings.length, 20, 'classic extraction must retain every body');
      assert.equal(simulation.escaped, false);
    } finally { simulation.dispose(); }
  }
});

test('twenty-ring collection keeps its denominator through removal, restart, and one victory event', () => {
  const simulation = new Simulation({ ringCount: 20 });
  simulation.mode = 'collect';
  let victories = 0;
  simulation.onWin = () => victories++;
  try {
    simulation.reset('stack', { ringCount: 20 });
    for (let step = 0; step < 60 / DT; step++) {
      if (step % 120 === 0) simulation.pump(step % 240 === 0 ? 'left' : 'right');
      simulation.step();
      assert.equal(simulation.collected + simulation.rings.length, 20);
      assert.equal(simulation.totalRings, 20);
    }
    assert.equal(simulation.escaped, false);
    assert.equal(simulation.won, true, 'twenty physical base contacts must complete the collect objective');
    assert.equal(simulation.collected, 20);
    assert.equal(victories, 1);
    run(simulation, 1);
    assert.equal(victories, 1);

    simulation.reset('stack', { ringCount: 20 });
    assert.equal(simulation.collected, 0);
    assert.equal(simulation.totalRings, 20);
    assert.equal(simulation.rings.length, 20);
    assert.equal(simulation.won, false);
    for (let step = 0; step < 60 / DT; step++) {
      if (step % 120 === 0) simulation.pump(step % 240 === 0 ? 'left' : 'right');
      simulation.step();
    }
    assert.equal(simulation.won, true);
    assert.equal(simulation.collected, 20);
    assert.equal(victories, 2, 'the restarted round emits exactly one new victory');
  } finally { simulation.dispose(); }
});
