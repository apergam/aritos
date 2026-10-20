import test from 'node:test';
import assert from 'node:assert/strict';
import { clampStickerPlacementToSurface, createStickerFeature, DEFAULT_STICKERS, normalizeStickerPoint, parseStickerData, processStickerVictory, STICKER_STORAGE_KEY, type StickerData } from '../src/stickers';
import type { GameEvent } from '../src/game/session';

test('a theme victory grants its one catalog reward once and earned rewards cross themes', () => {
  let data: StickerData = { unlocked: [], placements: [] };
  let awardedRound: number | null = null;
  const first = processStickerVictory(data, 4, awardedRound, 4, 'ocean', DEFAULT_STICKERS);
  data = first.data; awardedRound = first.awardedRoundId;
  assert.deepEqual(data.unlocked, ['ocean-octopus']);
  assert.equal(first.reward?.id, 'ocean-octopus');
  const duplicateVictory = processStickerVictory(data, 4, awardedRound, 4, 'ocean', DEFAULT_STICKERS);
  assert.equal(duplicateVictory.data, data);
  assert.equal(duplicateVictory.reward, null);
  // Theme changes within a round retain the once-per-round guard.
  const afterThemeChange = processStickerVictory(data, 4, awardedRound, 4, 'space', DEFAULT_STICKERS);
  assert.equal(afterThemeChange.data, data);
  assert.equal(afterThemeChange.reward, null);
  const nextRound = processStickerVictory(data, 5, awardedRound, 5, 'space', DEFAULT_STICKERS);
  data = nextRound.data;
  assert.deepEqual(data.unlocked, ['ocean-octopus', 'space-rocket']);
  const stale = processStickerVictory(data, 5, nextRound.awardedRoundId, 4, 'capybaras', DEFAULT_STICKERS);
  assert.equal(stale.data, data);
  assert.equal(parseStickerData(JSON.stringify({ version: 1, data }), DEFAULT_STICKERS).unlocked.length, 2);
});

test('reload parsing allowlists IDs, clamps no malformed coordinates, and caps unique placements at three', () => {
  const payload = JSON.stringify({ version: 1, data: {
    unlocked: ['ocean-octopus', 'space-rocket', 'capybara-capy', 'unknown', 'ocean-octopus'],
    placements: [
      { id: 'ocean-octopus', x: 0.1, y: 0.2 },
      { id: 'space-rocket', x: 0.5, y: 0.5 },
      { id: 'capybara-capy', x: 0.9, y: 0.8 },
      { id: 'ocean-octopus', x: 0.4, y: 0.4 },
      { id: 'bad', x: 0.4, y: 0.4 },
      { id: 'space-rocket', x: Number.NaN, y: 0.1 },
    ],
  } });
  assert.deepEqual(parseStickerData(payload, DEFAULT_STICKERS), {
    unlocked: ['ocean-octopus', 'space-rocket', 'capybara-capy'],
    placements: [
      { id: 'ocean-octopus', x: 0.1, y: 0.2 },
      { id: 'space-rocket', x: 0.5, y: 0.5 },
      { id: 'capybara-capy', x: 0.9, y: 0.8 },
    ],
  });
});

test('malformed, unsupported, and unavailable save data safely falls back empty', () => {
  assert.deepEqual(parseStickerData('{broken', DEFAULT_STICKERS), { unlocked: [], placements: [] });
  assert.deepEqual(parseStickerData('{"version":9,"data":{"unlocked":["ocean-octopus"]}}', DEFAULT_STICKERS), { unlocked: [], placements: [] });
  assert.deepEqual(parseStickerData(null, DEFAULT_STICKERS), { unlocked: [], placements: [] });
});

test('placement coordinates stay inside the toy surface and reject invalid dimensions', () => {
  assert.deepEqual(normalizeStickerPoint({ x: 18, y: 900 }, 300, 200), { x: 0.06, y: 0.94 });
  assert.deepEqual(normalizeStickerPoint({ x: 150, y: 100 }, 300, 200), { x: 0.5, y: 0.5 });
  // A 29px sticker (14% of a 205px toy front) remains fully inside the surface.
  assert.deepEqual(normalizeStickerPoint({ x: 0, y: 0 }, 205, 274, 29 / (2 * 205) + 0.01, 29 / (2 * 274) + 0.01), {
    x: 29 / (2 * 205) + 0.01,
    y: 29 / (2 * 274) + 0.01,
  });
  assert.equal(normalizeStickerPoint({ x: 5, y: 5 }, 0, 200), null);
  assert.equal(normalizeStickerPoint({ x: Number.NaN, y: 5 }, 300, 200), null);
});

test('surface resize clamps only stickers that would cross the edge and does not drift on repeated refresh', () => {
  const centered = { id: 'ocean-octopus', x: 0.5, y: 0.5 };
  assert.deepEqual(clampStickerPlacementToSurface(centered, 205, 274), centered);
  const nearEdge = { id: 'ocean-octopus', x: 0.07, y: 0.93 };
  const clamped = clampStickerPlacementToSurface(nearEdge, 205, 274);
  assert.notDeepEqual(clamped, nearEdge);
  assert.deepEqual(clampStickerPlacementToSurface(clamped, 205, 274), clamped);
  assert.equal(clampStickerPlacementToSurface(centered, 0, 274), centered);
});

class FakeClassList {
  constructor(private readonly element: FakeElement) {}
  add(...names: string[]) { const set = new Set(this.element.className.split(/\s+/).filter(Boolean)); names.forEach(name => set.add(name)); this.element.className = [...set].join(' '); }
  contains(name: string) { return this.element.className.split(/\s+/).includes(name); }
  toggle(name: string, force?: boolean) {
    const has = this.contains(name), shouldAdd = force ?? !has;
    if (shouldAdd && !has) this.add(name);
    if (!shouldAdd && has) this.element.className = this.element.className.split(/\s+/).filter(value => value && value !== name).join(' ');
    return shouldAdd;
  }
}

class FakeElement {
  ownerDocument!: FakeDocument;
  children: FakeElement[] = [];
  parent: FakeElement | null = null;
  className = '';
  readonly classList = new FakeClassList(this);
  style: Record<string, string> = {};
  attributes = new Map<string, string>();
  listeners = new Map<string, Array<(event: any) => void>>();
  tagName: string;
  textContent = '';
  src = '';
  alt = '';
  draggable = true;
  type = '';
  tabIndex = 0;
  hidden = false;
  disabled = false;
  open = false;
  removed = false;
  decoding = '';
  constructor(tagName: string) { this.tagName = tagName.toLowerCase(); }
  get isConnected() { let item: FakeElement | null = this; while (item?.parent) item = item.parent; return item === this.ownerDocument.body; }
  get clientWidth() { return Number.parseFloat(this.style.width ?? '') || 400; }
  get clientHeight() { return Number.parseFloat(this.style.height ?? '') || 300; }
  append(...children: FakeElement[]) { children.forEach(child => { child.remove(); child.parent = this; this.children.push(child); }); }
  prepend(child: FakeElement) { child.remove(); child.parent = this; this.children.unshift(child); }
  appendChild<T extends FakeElement>(child: T): T { this.append(child); return child; }
  replaceChildren(...children: FakeElement[]) { this.children.slice().forEach(child => child.remove()); this.append(...children); }
  setAttribute(name: string, value: string) { this.attributes.set(name, value); }
  getAttribute(name: string) { return this.attributes.get(name) ?? null; }
  addEventListener(type: string, listener: (event: any) => void) { const items = this.listeners.get(type) ?? []; items.push(listener); this.listeners.set(type, items); }
  removeEventListener(type: string, listener: (event: any) => void) { this.listeners.set(type, (this.listeners.get(type) ?? []).filter(item => item !== listener)); }
  remove() { this.removed = true; if (this.parent) this.parent.children = this.parent.children.filter(item => item !== this); this.parent = null; }
  focus() { this.ownerDocument.activeElement = this; }
  closest(selector: string): FakeElement | null {
    let item: FakeElement | null = this;
    while (item) {
      if (selector.includes('.sticker') && item.classList.contains('sticker')) return item;
      if (selector.includes('button') && item.tagName === 'button') return item;
      if (selector.includes('dialog') && item.tagName === 'dialog') return item;
      item = item.parent;
    }
    return null;
  }
  querySelector(selector: string): FakeElement | null { return this.children.map(child => child.matches(selector) ? child : child.querySelector(selector)).find(Boolean) ?? null; }
  matches(selector: string) { return selector.startsWith('.') ? this.classList.contains(selector.slice(1)) : selector.startsWith('#') ? this.attributes.get('id') === selector.slice(1) : selector === 'button' && this.tagName === 'button'; }
  getBoundingClientRect() {
    const left = Number.parseFloat(this.style.left ?? '') || 0, top = Number.parseFloat(this.style.top ?? '') || 0;
    const width = Number.parseFloat(this.style.width ?? '') || (this.tagName === 'div' ? 400 : 30), height = Number.parseFloat(this.style.height ?? '') || (this.tagName === 'div' ? 300 : 30);
    return { left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) };
  }
  setPointerCapture(_pointerId: number) {}
  hasPointerCapture(_pointerId: number) { return false; }
  releasePointerCapture(_pointerId: number) {}
}

class FakeDocument {
  body = new FakeElement('body');
  activeElement: FakeElement | null = null;
  constructor() { this.body.ownerDocument = this; }
  createElement(tag: string) { const element = new FakeElement(tag); element.ownerDocument = this; return element; }
  querySelector(selector: string) { return this.body.matches(selector) ? this.body : this.body.querySelector(selector); }
}

class FakeWindow {
  document: FakeDocument;
  listeners = new Map<string, Array<(event: any) => void>>();
  pendingFrames = new Map<number, FrameRequestCallback>();
  timers = new Map<number, () => void>();
  private id = 0;
  constructor(document: FakeDocument) { this.document = document; }
  addEventListener(type: string, listener: (event: any) => void) { const items = this.listeners.get(type) ?? []; items.push(listener); this.listeners.set(type, items); }
  removeEventListener(type: string, listener: (event: any) => void) { this.listeners.set(type, (this.listeners.get(type) ?? []).filter(item => item !== listener)); }
  requestAnimationFrame(callback: FrameRequestCallback) { const id = ++this.id; this.pendingFrames.set(id, callback); return id; }
  cancelAnimationFrame(id: number) { this.pendingFrames.delete(id); }
  setTimeout(callback: () => void, _delay?: number) { const id = ++this.id; this.timers.set(id, callback); return id; }
  clearTimeout(id: number) { this.timers.delete(id); }
}

function withFakeBrowser<T>(run: (document: FakeDocument, win: FakeWindow) => T): T {
  const document = new FakeDocument(), win = new FakeWindow(document);
  const root = globalThis as unknown as Record<string, unknown>;
  const prior = new Map<string, PropertyDescriptor | undefined>();
  for (const [key, value] of Object.entries({ document, window: win, HTMLElement: FakeElement, Element: FakeElement, HTMLDialogElement: FakeElement })) {
    prior.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  try { return run(document, win); }
  finally {
    for (const [key, descriptor] of prior) descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete root[key];
  }
}

function createStorage(seed: string | null = null) {
  let value = seed, reads = 0, writes = 0;
  return {
    get reads() { return reads; }, get writes() { return writes; }, get value() { return value; },
    getItem(_key: string) { reads++; return value; },
    setItem(_key: string, next: string) { writes++; value = next; },
  };
}

const stickerVictory = (roundId: number): GameEvent => ({ type: 'victory', roundId, mode: 'classic' });
const surface = () => ({ left: 10, top: 12, width: 205, height: 274 });

test('createStickerFeature persists one real victory and reloads its earned placement', () => withFakeBrowser((document) => {
  const storage = createStorage();
  const host = document.createElement('div'); document.body.append(host);
  const feature = createStickerFeature(host as unknown as HTMLElement, { catalog: DEFAULT_STICKERS, getSurface: surface, onEditingChange: () => {}, storage });
  feature.setRound(3, 'ocean'); feature.handle(stickerVictory(3)); feature.handle(stickerVictory(3));
  assert.equal(storage.reads, 1);
  assert.equal(storage.writes, 1, 'duplicate victory cannot write a second reward');
  feature.dispose();
  const payload = JSON.parse(storage.value!);
  payload.data.placements = [{ id: 'ocean-octopus', x: 0.5, y: 0.5 }];
  const seeded = createStorage(JSON.stringify(payload));
  const reloadedHost = document.createElement('div'); document.body.append(reloadedHost);
  const reloaded = createStickerFeature(reloadedHost as unknown as HTMLElement, { catalog: DEFAULT_STICKERS, getSurface: surface, onEditingChange: () => {}, storage: seeded });
  const overlay = reloadedHost.children[0]!;
  assert.equal(overlay.children.length, 1);
  assert.equal(overlay.children[0]!.style.left, '50%');
  assert.equal(overlay.children[0]!.children[0]!.alt, 'Sticker de pulpo');
  assert.equal(seeded.reads, 1); assert.equal(seeded.writes, 0);
  reloaded.dispose();
}));

test('sandbox never reads or writes normal storage, even for a victory with preseeded data', () => withFakeBrowser((document) => {
  const seededPayload = JSON.stringify({ version: 1, data: { unlocked: ['ocean-octopus'], placements: [] } });
  const storage = createStorage(seededPayload);
  const host = document.createElement('div'); document.body.append(host);
  const feature = createStickerFeature(host as unknown as HTMLElement, { catalog: DEFAULT_STICKERS, getSurface: surface, onEditingChange: () => {}, storage, eligible: false });
  feature.setRound(8, 'space'); feature.handle(stickerVictory(8)); feature.open();
  const panel = document.body.children.find(child => child.classList.contains('sticker-panel'))!;
  assert.match(panel.textContent + panel.children.map(child => child.textContent).join(' '), /Modo de prueba/);
  assert.equal(storage.reads, 0); assert.equal(storage.writes, 0); assert.equal(storage.value, seededPayload);
  feature.dispose();
}));

test('throwing storage falls back safely and disposed features ignore late victories', () => withFakeBrowser((document) => {
  let writes = 0;
  const storage = { getItem() { throw new Error('blocked'); }, setItem() { writes++; throw new Error('blocked'); } };
  const host = document.createElement('div'); document.body.append(host);
  const feature = createStickerFeature(host as unknown as HTMLElement, { catalog: DEFAULT_STICKERS, getSurface: surface, onEditingChange: () => {}, storage });
  feature.setRound(9, 'capybaras'); feature.handle(stickerVictory(9));
  assert.equal(writes, 1, 'failed storage writes are caught without breaking the award');
  feature.dispose(); feature.setRound(10, 'ocean'); feature.handle(stickerVictory(10));
  assert.equal(writes, 1, 'late events after teardown cannot write');
}));
