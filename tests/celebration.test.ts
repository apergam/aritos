import test from 'node:test';
import assert from 'node:assert/strict';
import { createCelebration, CELEBRATION_DURATION_MS, type CelebrationTimer } from '../src/celebration/celebration-controller';
import type { GameEvent } from '../src/game/session';
import { theme } from '../src/themes';

class FakeClassList {
  private values = new Set<string>();
  add(value: string) { this.values.add(value); }
  remove(value: string) { this.values.delete(value); }
  contains(value: string) { return this.values.has(value); }
}

class FakeElement {
  ownerDocument!: FakeDocument;
  children: FakeElement[] = [];
  parent?: FakeElement;
  className = '';
  classList = new FakeClassList();
  dataset: Record<string, string> = {};
  attributes = new Map<string, string>();
  style = { setProperty: (_name: string, _value: string) => undefined };
  src = '';
  alt = '';
  draggable = true;
  removed = false;
  appendChild<T extends FakeElement>(child: T): T { child.parent = this; this.children.push(child); return child; }
  replaceChildren(...children: FakeElement[]) { this.children = []; for (const child of children) this.appendChild(child); }
  setAttribute(name: string, value: string) { this.attributes.set(name, value); }
  remove() { this.removed = true; if (this.parent) this.parent.children = this.parent.children.filter(item => item !== this); }
}

class FakeDocument {
  createElement(_tag: string) { const element = new FakeElement(); element.ownerDocument = this; return element; }
}

class FakeTimer implements CelebrationTimer {
  time = 0;
  nextId = 0;
  pending = new Map<number, { at: number; callback: () => void }>();
  callbacks: Array<() => void> = [];
  now = () => this.time;
  setTimeout = (callback: () => void, delayMs: number) => {
    const id = ++this.nextId;
    const entry = { at: this.time + delayMs, callback };
    this.pending.set(id, entry); this.callbacks.push(callback); return id;
  };
  clearTimeout = (handle: unknown) => { this.pending.delete(handle as number); };
  advance(ms: number) {
    this.time += ms;
    for (const [id, item] of [...this.pending]) {
      if (item.at <= this.time) { this.pending.delete(id); item.callback(); }
    }
  }
}

const createHost = () => {
  const doc = new FakeDocument();
  const host = doc.createElement('div');
  return { doc, host, layer: () => host.children[0]! };
};
const victory = (roundId: number, mode: 'classic' | 'collect' = 'collect'): GameEvent => ({ type: 'victory', roundId, mode });

test('celebration handles real session victory event shapes once per round and tracks theme appearance', () => {
  const { host, layer } = createHost();
  const timer = new FakeTimer();
  const controller = createCelebration(host as unknown as HTMLElement, { theme: 'ocean', roundId: 4, timer });
  try {
    const mascot = layer().children[0]!;
    assert.equal(layer().dataset.state, 'idle');
    assert.match(mascot.src, /image\/svg\+xml/);
    assert.equal(layer().children[1]?.children.length, 24);

    controller.handle(victory(3));
    controller.handle({ type: 'ring-collected', roundId: 4, ringId: 11, collected: 12, total: 12 });
    assert.equal(layer().dataset.state, 'idle');
    controller.handle(victory(4, 'classic'));
    const firstCallback = timer.callbacks[0]!;
    controller.handle(victory(4, 'classic'));
    assert.equal(timer.callbacks.length, 1, 'duplicate victories do not extend or retrigger the effect');

    controller.setTheme('space');
    assert.equal(mascot.src, theme('space').assets.mascot.source);
    assert.equal(layer().dataset.state, 'active', 'theme changes keep the current effect active');
    assert.equal(timer.callbacks.length, 1, 'theme changes do not issue a second victory');
    controller.setQuality('reduced');
    assert.equal(layer().children[1]?.children.length, 10);

    controller.setRound(5);
    assert.equal(layer().dataset.state, 'idle');
    controller.handle(victory(5));
    firstCallback(); // A callback already queued before restart must not hide the new effect.
    assert.equal(layer().dataset.state, 'active');
  } finally { controller.dispose(); }
});

test('pause freezes the four-second effect lifetime; disposal cancels and removes owned DOM', () => {
  const { host, layer } = createHost();
  const timer = new FakeTimer();
  const controller = createCelebration(host as unknown as HTMLElement, { theme: 'capybaras', roundId: 0, timer });
  const overlay = layer();
  controller.handle(victory(0));
  timer.advance(1_250);
  controller.setPaused(true);
  assert.equal(overlay.classList.contains('is-paused'), true);
  timer.advance(CELEBRATION_DURATION_MS * 2);
  assert.equal(overlay.dataset.state, 'active', 'paused time does not expire the effect');
  controller.setPaused(false);
  timer.advance(CELEBRATION_DURATION_MS - 1_250 - 1);
  assert.equal(overlay.dataset.state, 'active');
  timer.advance(1);
  assert.equal(overlay.dataset.state, 'idle');

  controller.handle(victory(0));
  controller.dispose();
  assert.equal(host.children.length, 0);
  assert.equal(overlay.removed, true);
  for (const callback of timer.callbacks) callback();
  assert.equal(host.children.length, 0);
});
