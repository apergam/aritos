import assert from 'node:assert/strict';
import test from 'node:test';
import { TOY_MODELS, TOY_OUTLETS, TOY_PHYSICS, toyModel } from '../src/models/toy-model.ts';

test('fixed models expose exactly their physical buttons and concrete outlets', () => {
  const single = toyModel('single-button');
  const dual = toyModel('two-button');

  assert.equal(single.buttonCount, 1);
  assert.deepEqual(single.pumpSides, ['center']);
  assert.deepEqual(single.outlets, ['center']);
  assert.deepEqual(single.outletDefinitions, { center: TOY_OUTLETS.center });

  assert.equal(dual.buttonCount, 2);
  assert.deepEqual(dual.pumpSides, ['left', 'right']);
  assert.deepEqual(dual.outlets, ['left', 'right']);
  assert.deepEqual(dual.outletDefinitions, {
    left: TOY_OUTLETS.left,
    right: TOY_OUTLETS.right,
  });
  assert.equal(dual.pumpSides.length, 2, 'both side pumps can be pulsed together');
  assert.equal(toyModel('single-button'), TOY_MODELS['single-button']);
});

test('models share the accepted tank, ring, peg, floor-base, and pump tuning', () => {
  assert.equal(TOY_MODELS['single-button'].physics, TOY_PHYSICS);
  assert.equal(TOY_MODELS['two-button'].physics, TOY_PHYSICS);
  assert.deepEqual(TOY_PHYSICS.tank, { x: 4.5, y: 6, z: 0.9 });
  assert.deepEqual(TOY_PHYSICS.ring, { radius: 0.52, tube: 0.13, segments: 20 });
  assert.deepEqual(TOY_PHYSICS.pegs, [{ x: -1.7, z: 0 }, { x: 1.7, z: 0 }]);
  assert.equal(TOY_PHYSICS.pegRadius, 0.11);
  assert.equal(TOY_PHYSICS.base.topY, -TOY_PHYSICS.tank.y + TOY_PHYSICS.base.footHeight);
  assert.equal(TOY_PHYSICS.pegTipY, TOY_PHYSICS.base.topY + 4.35);
  assert.equal(TOY_PHYSICS.strength, 75);
  assert.equal(TOY_PHYSICS.drag, 0.5);
  assert.equal(TOY_PHYSICS.pulseDuration, 0.24);

  // Twelve horizontal rings fit along a peg with clearance to spare.
  assert.ok(12 * 2 * TOY_PHYSICS.ring.tube < TOY_PHYSICS.pegTipY - TOY_PHYSICS.base.topY);
});

test('outlet vectors preserve the central pump and lower inward/upward side jets', () => {
  const { left, right, center } = TOY_OUTLETS;
  assert.deepEqual(center.origin, { x: 0, y: -5.7, z: 0 });
  assert.deepEqual(center.direction, { x: 0, y: 1, z: 0 });
  assert.deepEqual(left.origin, { x: -4.2, y: -5.25, z: 0 });
  assert.deepEqual(right.origin, { x: 4.2, y: -5.25, z: 0 });

  for (const outlet of [left, right]) {
    assert.ok(outlet.origin.y < 0, 'side jet remains low in the tank');
    assert.ok(outlet.direction.y > 0, 'side jet points upward');
    assert.equal(Math.hypot(outlet.direction.x, outlet.direction.y, outlet.direction.z), 1);
  }
  assert.ok(left.direction.x > 0, 'left side jet points toward the tank center');
  assert.ok(right.direction.x < 0, 'right side jet points toward the tank center');
});

test('registry mechanics are immutable and contain no theme or artwork fields', () => {
  assert.ok(Object.isFrozen(TOY_MODELS));
  assert.ok(Object.isFrozen(TOY_PHYSICS));
  assert.ok(Object.isFrozen(TOY_PHYSICS.tank));
  assert.ok(Object.isFrozen(TOY_OUTLETS.left.origin));
  assert.ok(Object.isFrozen(TOY_MODELS['two-button'].pumpSides));
  for (const model of Object.values(TOY_MODELS)) {
    assert.deepEqual(Object.keys(model).sort(), [
      'buttonCount', 'id', 'outletDefinitions', 'outlets', 'physics', 'pumpSides',
    ]);
  }
});
