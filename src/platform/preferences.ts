import type { ToyModelId } from '../models/toy-model';

/** Only durable user choices belong here; a round and its physics state never do. */
export type PlayerPreferences = Readonly<{ model: ToyModelId; theme: string; sound: boolean; control: 'motion' | 'manual' }>;
export const DEFAULT_PREFERENCES: PlayerPreferences = Object.freeze({ model: 'two-button', theme: 'ocean', sound: true, control: 'manual' });
export const PREFERENCES_KEY = 'aritos.preferences.v1';

export function parsePreferences(serialized: string | null, fallback: PlayerPreferences = DEFAULT_PREFERENCES): PlayerPreferences {
  if (!serialized) return fallback;
  try {
    const value: unknown = JSON.parse(serialized);
    if (!value || typeof value !== 'object') return fallback;
    const p = value as Record<string, unknown>;
    return Object.freeze({
      model: p.model === 'single-button' ? 'single-button' : p.model === 'two-button' ? 'two-button' : fallback.model,
      theme: typeof p.theme === 'string' && p.theme.length > 0 ? p.theme : fallback.theme,
      sound: typeof p.sound === 'boolean' ? p.sound : fallback.sound,
      control: p.control === 'motion' || p.control === 'manual' ? p.control : fallback.control,
    });
  } catch { return fallback; }
}

/** Storage failures degrade to in-memory defaults and never interrupt play. */
export function createPreferenceStore(storage?: Pick<Storage, 'getItem' | 'setItem'>) {
  return Object.freeze({
    load(fallback: PlayerPreferences = DEFAULT_PREFERENCES): PlayerPreferences {
      try { return parsePreferences(storage?.getItem(PREFERENCES_KEY) ?? null, fallback); } catch { return fallback; }
    },
    save(preferences: PlayerPreferences): boolean {
      try { if (!storage) return false; storage.setItem(PREFERENCES_KEY, JSON.stringify(preferences)); return true; } catch { return false; }
    },
  });
}
