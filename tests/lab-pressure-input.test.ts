import assert from 'node:assert/strict';
import test from 'node:test';
import { bindPressureInput } from '../src/lab/experiments/pressure-input';
import { PressureGestureController, type PressurePulse, type PressureSide } from '../src/lab/experiments/pressure';

type Handler = (event: any) => void;
class FakeTarget {
  private listeners = new Map<string, Set<Handler>>();
  addEventListener(type: string, listener: EventListener): void { const set = this.listeners.get(type) ?? new Set(); set.add(listener as Handler); this.listeners.set(type, set); }
  removeEventListener(type: string, listener: EventListener): void { this.listeners.get(type)?.delete(listener as Handler); }
  emit(type: string, event: Record<string, unknown> = {}): void {
    const value = { type, preventDefault() { this.defaultPrevented = true; }, defaultPrevented: false, ...event };
    for (const handler of [...(this.listeners.get(type) ?? [])]) handler(value);
  }
  count(type: string): number { return this.listeners.get(type)?.size ?? 0; }
}

class FakeButton extends FakeTarget {
  style = { touchAction: '' };
  private captured = new Set<number>();
  private classes = new Set<string>();
  classList = { add: (name: string) => this.classes.add(name), remove: (name: string) => this.classes.delete(name), contains: (name: string) => this.classes.has(name) };
  setPointerCapture(id: number): void { this.captured.add(id); }
  hasPointerCapture(id: number): boolean { return this.captured.has(id); }
  releasePointerCapture(id: number): void { this.captured.delete(id); }
  get pressed(): boolean { return this.classes.has('pressed'); }
}

function setup(paused: () => boolean = () => false) {
  const fakeWindow = new FakeTarget(), fakeDocument = Object.assign(new FakeTarget(), { hidden: false });
  const originalWindow = globalThis.window, originalDocument = globalThis.document;
  Object.assign(globalThis, { window: fakeWindow, document: fakeDocument });
  const buttons: Record<PressureSide, FakeButton> = { left: new FakeButton(), right: new FakeButton(), center: new FakeButton() };
  const controller = new PressureGestureController();
  const pulses: PressurePulse[] = [], statuses: string[] = [];
  const binding = bindPressureInput(buttons as unknown as Record<PressureSide, HTMLElement>, controller, { paused, pulse: pulse => pulses.push(pulse), status: message => statuses.push(message) });
  return {
    buttons, controller, pulses, statuses, binding, fakeWindow, fakeDocument,
    restore() { binding.dispose(); Object.assign(globalThis, { window: originalWindow, document: originalDocument }); },
  };
}

function pointer(pointerId: number, timeStamp: number, extra: Record<string, unknown> = {}) {
  return { pointerId, pointerType: 'touch', button: 0, pressure: .5, timeStamp, preventDefault() {}, ...extra };
}

test('fixed and level modes pulse immediately once and suppress the following native pointer click', async () => {
  const t = setup();
  try {
    t.controller.setLevel(1.5);
    t.buttons.left.emit('pointerdown', pointer(1, 0));
    assert.deepEqual(t.pulses.map(p => [p.side, p.intensity, p.source]), [['left', 1, 'fixed']]);
    t.fakeWindow.emit('pointerup', pointer(1, 10));
    t.buttons.left.emit('click', { detail: 1 });
    await Promise.resolve();
    assert.equal(t.pulses.length, 1);

    t.controller.setMode('levels');
    t.controller.setLevel(.5);
    t.buttons.right.emit('pointerdown', pointer(2, 20));
    assert.equal(t.pulses.length, 2);
    assert.deepEqual(t.pulses[1], { side: 'right', intensity: .5, durationSeconds: .24, source: 'level' });
    t.fakeWindow.emit('pointerup', pointer(2, 25));
    t.buttons.right.emit('click', { detail: 1 });
    await Promise.resolve();
    assert.equal(t.pulses.length, 2);
  } finally { t.restore(); }
});

test('charge mode fires once on release with duration-derived intensity', () => {
  const t = setup();
  try {
    t.controller.setMode('charge');
    t.buttons.center.emit('pointerdown', pointer(7, 100));
    assert.equal(t.pulses.length, 0);
    assert.equal(t.buttons.center.pressed, true);
    assert.match(t.statuses.at(-1) ?? '', /suelta para bombear/);
    t.fakeWindow.emit('pointerup', pointer(7, 1000));
    assert.equal(t.pulses.length, 1);
    assert.deepEqual(t.pulses[0], { side: 'center', intensity: 1.5, durationSeconds: .24, source: 'charge' });
    assert.equal(t.buttons.center.pressed, false);
  } finally { t.restore(); }
});

test('independent pointer IDs can pump separate sides without cross-cancellation', () => {
  const t = setup();
  try {
    t.controller.setMode('charge');
    t.buttons.left.emit('pointerdown', pointer(11, 0));
    t.buttons.right.emit('pointerdown', pointer(22, 0));
    assert.equal(t.controller.activeCount, 2);
    assert.equal(t.pulses.length, 0);
    t.fakeWindow.emit('pointerup', pointer(11, 450));
    assert.equal(t.controller.activeCount, 1);
    assert.deepEqual(t.pulses.map(p => [p.side, p.intensity]), [['left', 1]]);
    t.fakeWindow.emit('pointerup', pointer(22, 900));
    assert.equal(t.controller.activeCount, 0);
    assert.deepEqual(t.pulses.map(p => [p.side, p.intensity]), [['left', 1], ['right', 1.5]]);
  } finally { t.restore(); }
});

test('charge pointer cancellation, blur, hidden document and pause clear held state without stale pulses', () => {
  let paused = false;
  const t = setup(() => paused);
  try {
    t.controller.setMode('charge');
    t.buttons.left.emit('pointerdown', pointer(1, 0));
    t.fakeWindow.emit('pointercancel', pointer(1, 400));
    t.fakeWindow.emit('pointerup', pointer(1, 900));
    assert.equal(t.pulses.length, 0);

    t.buttons.right.emit('pointerdown', pointer(2, 1000));
    t.fakeWindow.emit('blur');
    t.fakeWindow.emit('pointerup', pointer(2, 2000));
    assert.equal(t.pulses.length, 0);

    t.buttons.center.emit('pointerdown', pointer(3, 3000));
    t.fakeDocument.hidden = true;
    t.fakeDocument.emit('visibilitychange');
    t.fakeWindow.emit('pointerup', pointer(3, 4000));
    assert.equal(t.pulses.length, 0);

    t.fakeDocument.hidden = false;
    t.buttons.left.emit('pointerdown', pointer(4, 5000));
    paused = true;
    t.binding.syncPaused();
    t.fakeWindow.emit('pointerup', pointer(4, 6000));
    assert.equal(t.controller.activeCount, 0);
    assert.equal(t.pulses.length, 0);
  } finally { t.restore(); }
});

test('keyboard and assistive clicks use one selected-level fallback pulse', () => {
  const t = setup();
  try {
    t.controller.setMode('levels');
    t.controller.setLevel(1.5);
    t.buttons.left.emit('keydown', { key: 'Enter', repeat: false });
    t.buttons.left.emit('click', { detail: 0 });
    t.buttons.left.emit('click', { detail: 0 }); // A separate assistive activation.
    t.buttons.left.emit('keydown', { key: ' ', repeat: true, preventDefault() {} });
    assert.deepEqual(t.pulses.map(p => [p.side, p.intensity, p.source]), [
      ['left', 1.5, 'level'], ['left', 1.5, 'level'],
    ]);
    t.controller.setMode('charge');
    t.buttons.right.emit('click', { detail: 0 });
    assert.deepEqual(t.pulses.at(-1), { side: 'right', intensity: 1.5, durationSeconds: .24, source: 'level' });
  } finally { t.restore(); }
});
