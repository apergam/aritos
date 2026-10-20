import test from 'node:test';
import assert from 'node:assert/strict';
import { PressureGestureController } from '../src/lab/experiments/pressure.js';

test('fixed and level modes emit one deterministic 0.24 second pulse on release', () => {
  const input = new PressureGestureController();
  assert.equal(input.begin(1, 'left', { kind: 'pointer', timeMs: 0 }), true);
  assert.equal(input.release(1, { timeMs: 100 })?.intensity, 1);
  assert.equal(input.release(1), null);

  input.setMode('levels');
  for (const level of [0.5, 1, 1.5] as const) {
    input.setLevel(level);
    input.begin(level * 10, 'right', { kind: 'keyboard', timeMs: 10 });
    const pulse = input.release(level * 10, { timeMs: 20 });
    assert.equal(pulse?.intensity, level);
    assert.equal(pulse?.durationSeconds, 0.24);
    assert.equal(pulse?.source, 'level');
  }
});

test('charge maps release time to bounded strength and never pumps on movement', () => {
  const input = new PressureGestureController();
  input.setMode('charge');
  input.begin(1, 'left', { kind: 'pointer', timeMs: 500 });
  input.move(1, { timeMs: 1000 });
  assert.equal(input.activeCount, 1);
  assert.equal(input.release(1, { timeMs: 500 })?.intensity, 0.5);

  input.begin(2, 'right', { kind: 'pointer', timeMs: 100 });
  assert.equal(input.release(2, { timeMs: 550 })?.intensity, 1);
  input.begin(3, 'center', { kind: 'pointer', timeMs: 100 });
  assert.equal(input.release(3, { timeMs: 1200 })?.intensity, 1.5);
});

test('hardware mode uses positive pen/touch pressure, excluding synthetic mouse pressure', () => {
  const input = new PressureGestureController();
  input.setMode('hardware');
  input.setLevel(0.5);
  input.begin(1, 'left', { kind: 'pointer', pointerType: 'pen', pressure: 0.1, timeMs: 0 });
  input.move(1, { pressure: 0.25 });
  assert.equal(input.release(1, { pressure: 0.25 })?.intensity, 0.75);
  input.begin(2, 'right', { kind: 'pointer', pointerType: 'touch', pressure: 1, timeMs: 0 });
  assert.equal(input.release(2)?.intensity, 0.5);
  input.begin(5, 'right', { kind: 'pointer', pointerType: 'touch', pressure: 0.5, timeMs: 0 });
  input.move(5, { pressure: 0.9 });
  assert.equal(input.release(5)?.intensity, 1.4);
  input.begin(3, 'left', { kind: 'pointer', pointerType: 'mouse', pressure: 0.5, timeMs: 0 });
  assert.equal(input.release(3)?.intensity, 0.5);
  input.begin(4, 'center', { kind: 'keyboard', pressure: 1, timeMs: 0 });
  assert.equal(input.release(4)?.intensity, 0.5);
});

test('simultaneous pointers keep independent sides and strengths', () => {
  const input = new PressureGestureController();
  input.setMode('levels');
  input.setLevel(0.5);
  input.begin(1, 'left', { kind: 'pointer', timeMs: 0 });
  input.setLevel(1.5);
  input.begin(2, 'right', { kind: 'pointer', timeMs: 0 });
  assert.equal(input.release(1)?.side, 'left');
  assert.equal(input.release(1), null);
  assert.equal(input.release(2)?.side, 'right');
  assert.equal(input.activeCount, 0);
});

test('cancel, pause, reset, and mode changes discard pending gestures', () => {
  const input = new PressureGestureController();
  input.setMode('charge');
  input.begin(1, 'left', { kind: 'pointer', timeMs: 0 });
  input.cancel(1);
  assert.equal(input.release(1, { timeMs: 900 }), null);

  input.begin(2, 'right', { kind: 'pointer', timeMs: 0 });
  input.setPaused(true);
  assert.equal(input.activeCount, 0);
  assert.equal(input.begin(3, 'left', { kind: 'pointer', timeMs: 100 }), false);
  assert.equal(input.release(2, { timeMs: 900 }), null);

  input.setPaused(false);
  input.begin(4, 'left', { kind: 'pointer', timeMs: 0 });
  input.clear();
  assert.equal(input.release(4, { timeMs: 900 }), null);
  input.begin(5, 'left', { kind: 'pointer', timeMs: 0 });
  input.setMode('fixed');
  assert.equal(input.release(5), null);
});

test('duplicate begins are ignored and all intensities clamp to supported bounds', () => {
  const input = new PressureGestureController();
  input.setMode('hardware');
  input.begin(1, 'left', { kind: 'pointer', pointerType: 'pen', pressure: 0.5, timeMs: 0 });
  input.move(1, { pressure: 0.75 });
  assert.equal(input.begin(1, 'right', { kind: 'pointer', pointerType: 'pen', pressure: 0.1, timeMs: 10 }), false);
  assert.equal(input.release(1, { pressure: 4 })?.intensity, 1.5);

  input.begin(2, 'right', { kind: 'pointer', pointerType: 'pen', pressure: -5, timeMs: 0 });
  assert.equal(input.release(2)?.intensity, 1);
});
