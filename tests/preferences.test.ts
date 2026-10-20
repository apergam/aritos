import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createPreferenceStore,
  DEFAULT_PREFERENCES,
  parsePreferences,
  PREFERENCES_KEY,
  type PlayerPreferences,
} from '../src/platform/preferences';

const customized: PlayerPreferences = Object.freeze({
  model: 'single-button', theme: 'space', sound: false, music: false, collectionSound: 'sparkle', control: 'motion',
});

test('missing preference data uses the accepted two-button defaults', () => {
  assert.deepEqual(parsePreferences(null), DEFAULT_PREFERENCES);
  assert.deepEqual(createPreferenceStore({ getItem: () => null, setItem: () => {} }).load(), DEFAULT_PREFERENCES);
});

test('malformed and unsupported formats safely use defaults', () => {
  assert.deepEqual(parsePreferences('{'), DEFAULT_PREFERENCES);
  assert.deepEqual(parsePreferences('null'), DEFAULT_PREFERENCES);
  assert.deepEqual(parsePreferences(JSON.stringify({ version: 2, preferences: customized })), DEFAULT_PREFERENCES);
  assert.deepEqual(parsePreferences(JSON.stringify({ model: 'single-button' })), DEFAULT_PREFERENCES);
});

test('valid fields survive partial and invalid data while invalid fields fall back', () => {
  const parsed = parsePreferences(JSON.stringify({
    version: 1,
    preferences: { model: 'single-button', theme: 'pastel', sound: false, control: 'keyboard' },
  }));
  assert.deepEqual(parsed, {
    ...DEFAULT_PREFERENCES, model: 'single-button', theme: 'ocean', sound: false, control: 'manual',
  });
  assert.deepEqual(parsePreferences(JSON.stringify({ version: 1, preferences: { theme: 'capybaras' } })), {
    ...DEFAULT_PREFERENCES, theme: 'capybaras',
  });
});

test('store reads and writes only supported preferences in a versioned envelope', () => {
  let savedKey = '';
  let savedValue = '';
  const store = createPreferenceStore({
    getItem: (key) => key === PREFERENCES_KEY ? savedValue || null : null,
    setItem: (key, value) => { savedKey = key; savedValue = value; },
  });
  const withRoundData = { ...customized, positions: [{ x: 1 }], collected: 12 } as PlayerPreferences;

  assert.equal(store.save(withRoundData), true);
  assert.equal(savedKey, PREFERENCES_KEY);
  assert.deepEqual(JSON.parse(savedValue), { version: 1, preferences: customized });
  assert.deepEqual(store.load(), customized);
});

test('storage method failures degrade to fallback behavior', () => {
  const throwingStore = createPreferenceStore({
    getItem: () => { throw new Error('blocked'); },
    setItem: () => { throw new Error('blocked'); },
  });
  assert.deepEqual(throwingStore.load(customized), customized);
  assert.equal(throwingStore.save(customized), false);
  assert.deepEqual(createPreferenceStore().load(), DEFAULT_PREFERENCES);
  assert.equal(createPreferenceStore().save(DEFAULT_PREFERENCES), false);
});

test('an inaccessible localStorage getter does not prevent loading or saving attempts', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() { throw new Error('blocked getter'); },
  });
  try {
    const store = createPreferenceStore();
    assert.deepEqual(store.load(), DEFAULT_PREFERENCES);
    assert.equal(store.save(DEFAULT_PREFERENCES), false);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else delete (globalThis as { localStorage?: unknown }).localStorage;
  }
});


test('legacy preferences retain mute and gain safe music/reward defaults', () => {
  const legacy = parsePreferences(JSON.stringify({ version: 1, preferences: {
    model: 'single-button', theme: 'capybaras', sound: false, control: 'manual',
  } }));
  assert.equal(legacy.sound, false);
  assert.equal(legacy.music, true, 'music choice does not override global mute');
  assert.equal(legacy.collectionSound, 'coin');
  const invalid = parsePreferences(JSON.stringify({ version: 1, preferences: {
    sound: false, music: 'yes', collectionSound: 'unknown',
  } }));
  assert.equal(invalid.sound, false);
  assert.equal(invalid.music, DEFAULT_PREFERENCES.music);
  assert.equal(invalid.collectionSound, DEFAULT_PREFERENCES.collectionSound);
});
