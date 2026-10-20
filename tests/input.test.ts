import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { INPUT_HELP, INPUT_SHORTCUTS, PocControls, PocMotionControls, type MotionControlsOptions } from '../src/input/poc-controls';
import type { PumpSide } from '../src/physics';

type Listener = (event: any) => void;
class FakeTarget {
  private listeners = new Map<string, Set<Listener>>();
  addEventListener(type: string, listener: Listener): void { const set = this.listeners.get(type) ?? new Set(); set.add(listener); this.listeners.set(type, set); }
  removeEventListener(type: string, listener: Listener): void { this.listeners.get(type)?.delete(listener); }
  emit(type: string, event: Record<string, unknown> = {}): void {
    const value = { type, preventDefault() { this.defaultPrevented = true; }, defaultPrevented: false, ...event };
    for (const listener of this.listeners.get(type) ?? []) listener(value);
  }
  count(type: string): number { return this.listeners.get(type)?.size ?? 0; }
}
class FakeDocument extends FakeTarget { hidden = false; }
class FakeScreenOrientation extends FakeTarget { angle = 0; }
function htmlElement(target = new FakeTarget()) {
  return Object.assign(target, { style: { touchAction: '' }, textContent: '', value: '', setPointerCapture() {} }) as unknown as HTMLElement;
}
function motionOptions(target: FakeTarget, permission?: () => Promise<string>, timeout = 8): MotionControlsOptions {
  const t = Object.assign(target, { document: new FakeDocument(), screen: { orientation: new FakeScreenOrientation() }, orientation: 0 });
  const ctor = permission ? { requestPermission: permission } : function DeviceOrientationEvent() {};
  (t as any).DeviceOrientationEvent = ctor;
  return {
    button: htmlElement(), status: htmlElement(), rollValue: htmlElement() as HTMLInputElement,
    pitchValue: htmlElement() as HTMLInputElement, rollLabel: htmlElement(), pitchLabel: htmlElement(),
    target: t as unknown as Window, sensorTimeoutMs: timeout,
  };
}

test('pump controls emit one pulse per pointer/key press and support simultaneous sides', () => {
  const target = Object.assign(new FakeTarget(), { document: new FakeDocument() });
  const left = htmlElement(), right = htmlElement();
  const pumps: PumpSide[] = [];
  const controls = new PocControls({ model: () => 'two-button', paused: () => false, pump: side => pumps.push(side), togglePause() {}, setManualTilt() {} }, { left, right }, target as unknown as Window);

  (left as any).emit('pointerdown', { pointerId: 1, button: 0 });
  (left as any).emit('pointerdown', { pointerId: 1, button: 0 });
  (right as any).emit('pointerdown', { pointerId: 2, button: 0 });
  target.emit('pointercancel', { pointerId: 1 });
  target.emit('pointerup', { pointerId: 2 });
  target.emit('keydown', { key: 'a', repeat: false });
  target.emit('keydown', { key: 'a', repeat: true });
  target.emit('keydown', { key: ' ', repeat: false });
  target.emit('keyup', { key: 'a' });
  target.emit('keyup', { key: ' ' });
  assert.deepEqual(pumps, ['left', 'right', 'left', 'left', 'right']);
  assert.equal((left as any).style.touchAction, 'none');
  controls.dispose();
  assert.equal((left as any).style.touchAction, '');
  assert.equal(target.count('keydown'), 0);
  target.emit('keydown', { key: 'd', repeat: false });
  assert.equal(pumps.length, 5);
});

test('focused pump buttons support Space, Enter, and assistive clicks without duplicate pulses', async () => {
  const target = Object.assign(new FakeTarget(), { document: new FakeDocument() });
  const left = htmlElement();
  const pumps: PumpSide[] = [];
  const controls = new PocControls({ model: () => 'two-button', paused: () => false, pump: side => pumps.push(side), togglePause() {}, setManualTilt() {} }, { left }, target as unknown as Window);

  (left as any).emit('keydown', { key: ' ', repeat: false });
  (left as any).emit('keydown', { key: ' ', repeat: true });
  (left as any).emit('click', { detail: 0 }); // Browser-synthesized click for the same key press.
  assert.deepEqual(pumps, ['left']);
  (left as any).emit('keyup', { key: ' ' });
  (left as any).emit('keydown', { key: 'Enter', repeat: false });
  (left as any).emit('click', { detail: 0 });
  await Promise.resolve();
  assert.deepEqual(pumps, ['left', 'left']);
  (left as any).emit('click', { detail: 0 }); // Assistive technology activation.
  (left as any).emit('click', { detail: 1 }); // Pointer click; pointerdown already handled it.
  assert.deepEqual(pumps, ['left', 'left', 'left']);
  controls.dispose();
});

test('button activation state clears on blur and window keyup after focus moves', () => {
  const target = Object.assign(new FakeTarget(), { document: new FakeDocument() });
  const left = htmlElement();
  const pumps: PumpSide[] = [];
  const controls = new PocControls({ model: () => 'two-button', paused: () => false, pump: side => pumps.push(side), togglePause() {}, setManualTilt() {} }, { left }, target as unknown as Window);

  (left as any).emit('keydown', { key: ' ', repeat: false });
  (left as any).emit('keydown', { key: ' ', repeat: true });
  target.emit('blur');
  (left as any).emit('keydown', { key: ' ', repeat: false });
  assert.deepEqual(pumps, ['left', 'left']);

  (left as any).emit('keydown', { key: 'Enter', repeat: false });
  target.emit('keyup', { key: 'Enter' }); // Focus moved before the button saw keyup.
  (left as any).emit('keydown', { key: 'Enter', repeat: false });
  assert.deepEqual(pumps, ['left', 'left', 'left', 'left']);
  controls.dispose();
});

test('global A and P shortcuts work from focused buttons while Space keeps native pump activation', () => {
  const target = Object.assign(new FakeTarget(), { document: new FakeDocument() });
  const left = htmlElement();
  const pumps: PumpSide[] = [];
  let pauses = 0;
  const controls = new PocControls({ model: () => 'two-button', paused: () => false, pump: side => pumps.push(side), togglePause: () => pauses++, setManualTilt() {} }, { left }, target as unknown as Window);
  const ordinaryButton = { closest: (selector: string) => selector.includes('button') ? {} : null } as unknown as EventTarget;

  target.emit('keydown', { key: 'p', repeat: false, target: ordinaryButton });
  target.emit('keydown', { key: 'a', repeat: false, target: ordinaryButton });
  target.emit('keyup', { key: 'p' });
  target.emit('keyup', { key: 'a' });
  assert.equal(pauses, 1);
  assert.deepEqual(pumps, ['left']);

  target.emit('keydown', { key: ' ', repeat: false, target: ordinaryButton });
  assert.deepEqual(pumps, ['left']); // The focused button retains its native Space activation.
  (left as any).emit('keydown', { key: ' ', repeat: false });
  target.emit('keydown', { key: ' ', repeat: false, target: left, defaultPrevented: true });
  assert.deepEqual(pumps, ['left', 'left']); // Element activation is not repeated globally.
  controls.dispose();
});

test('editing controls retain keyboard input and held orientation keys release on blur/hidden', () => {
  const target = Object.assign(new FakeTarget(), { document: new FakeDocument() });
  const tilts: Array<[number, number]> = [];
  const controls = new PocControls({ model: () => 'single-button', paused: () => false, pump() {}, togglePause() {}, setManualTilt: (r, p) => tilts.push([r, p]) }, {}, target as unknown as Window);
  const editor = { closest: () => ({}) } as unknown as EventTarget;
  target.emit('keydown', { key: 'ArrowLeft', repeat: false, target: editor });
  controls.update(0.05);
  assert.equal(tilts.length, 0);
  target.emit('keydown', { key: 'ArrowLeft', repeat: false });
  controls.update(0.05);
  assert.deepEqual(tilts.at(-1), [-4.5, 0]);
  target.emit('blur');
  controls.update(0.05);
  assert.equal(tilts.length, 1);
  target.emit('keydown', { key: 'ArrowRight', repeat: false });
  (target as any).document.hidden = true;
  (target as any).document.emit('visibilitychange');
  controls.update(0.05);
  assert.equal(tilts.length, 1);
  assert.deepEqual(INPUT_SHORTCUTS.map(item => item.keys), ['A / D', 'Espacio', 'Flechas', 'W / S', 'P']);
  assert.match(INPUT_HELP, /invertir/);
  controls.dispose();
});

test('sensor permission denial, no data, and unusable data keep manual inversion available', async () => {
  const deniedTarget = new FakeTarget();
  const denied = new PocMotionControls(motionOptions(deniedTarget, async () => 'denied'));
  await denied.enable();
  assert.equal(denied.state, 'denied');
  assert.match(denied.capabilityMessage, /manuales/);
  denied.invert();
  assert.ok(denied.gravity.distanceTo(new THREE.Vector3(0, 3, 0)) < 1e-8);
  denied.dispose();

  const missingTarget = new FakeTarget();
  const missing = new PocMotionControls(motionOptions(missingTarget));
  (missingTarget as any).DeviceOrientationEvent = undefined;
  await missing.enable();
  assert.equal(missing.state, 'unavailable');
  missing.dispose();

  const badTarget = new FakeTarget();
  const bad = new PocMotionControls(motionOptions(badTarget, undefined, 5));
  await bad.enable();
  badTarget.emit('deviceorientation', { beta: null, gamma: null });
  await new Promise(resolve => setTimeout(resolve, 12));
  assert.equal(bad.state, 'unusable-data');
  bad.setManual(0, 0);
  assert.equal(bad.state, 'manual');
  assert.ok(bad.gravity.distanceTo(new THREE.Vector3(0, -3, 0)) < 1e-8);
  bad.dispose();
});

test('usable sensor calibration and screen remapping preserve gravity; disposal blocks late permission', async () => {
  const target = new FakeTarget();
  const options = motionOptions(target, undefined, 100);
  const motion = new PocMotionControls(options);
  await motion.enable();
  target.emit('deviceorientation', { beta: 50, gamma: 20 });
  assert.equal(motion.state, 'usable');
  assert.ok(motion.gravity.distanceTo(new THREE.Vector3(0, -3, 0)) < 1e-8);
  (target as any).screen.orientation.angle = 90;
  target.emit('orientationchange');
  assert.ok(motion.gravity.distanceTo(new THREE.Vector3(0, -3, 0)) < 1e-8);
  motion.dispose();
  assert.equal(target.count('deviceorientation'), 0);
  assert.equal(target.count('orientationchange'), 0);

  let resolvePermission!: (value: string) => void;
  const delayedTarget = new FakeTarget();
  const delayed = new PocMotionControls(motionOptions(delayedTarget, () => new Promise(resolve => { resolvePermission = resolve; })));
  const pending = delayed.enable();
  delayed.dispose();
  resolvePermission('granted');
  await pending;
  assert.equal(delayed.state, 'waiting');
  assert.equal(delayedTarget.count('deviceorientation'), 0);
});

test('manual tilt cancels pending sensor permission; an activated stream watchdog reports lost data', async () => {
  let resolvePermission!: (value: string) => void;
  const pendingTarget = new FakeTarget();
  const pending = new PocMotionControls(motionOptions(pendingTarget, () => new Promise(resolve => { resolvePermission = resolve; })));
  const activating = pending.enable();
  pending.invert();
  resolvePermission('granted');
  await activating;
  assert.equal(pending.state, 'manual');
  assert.equal(pending.sensorMode, false);
  assert.ok(pending.gravity.distanceTo(new THREE.Vector3(0, 3, 0)) < 1e-8);
  pending.dispose();

  const quietTarget = new FakeTarget();
  const quiet = new PocMotionControls(motionOptions(quietTarget, undefined, 8));
  await quiet.enable();
  quietTarget.emit('deviceorientation', { beta: 35, gamma: 12 });
  assert.equal(quiet.state, 'usable');
  await new Promise(resolve => setTimeout(resolve, 14));
  assert.equal(quiet.state, 'unavailable');
  assert.equal(quiet.sensorMode, false);
  quiet.dispose();

  const invalidTarget = new FakeTarget();
  const invalid = new PocMotionControls(motionOptions(invalidTarget, undefined, 100));
  await invalid.enable();
  invalidTarget.emit('deviceorientation', { beta: 35, gamma: 12 });
  invalidTarget.emit('deviceorientation', { beta: null, gamma: null });
  invalidTarget.emit('deviceorientation', { beta: NaN, gamma: NaN });
  invalidTarget.emit('deviceorientation', { beta: null, gamma: null });
  assert.equal(invalid.state, 'unusable-data');
  assert.equal(invalid.sensorMode, false);
  invalid.dispose();
});
