import type { ToyModelId } from '../models/toy-model';

export type ThemeId = 'ocean' | 'space' | 'capybaras';
export type ControlPreference = 'motion' | 'manual';

/** Only durable user choices belong here; round and physics state never do. */
export type PlayerPreferences = Readonly<{
  model: ToyModelId;
  theme: ThemeId;
  sound: boolean;
  control: ControlPreference;
}>;

export const DEFAULT_PREFERENCES: PlayerPreferences = Object.freeze({
  model: 'two-button',
  theme: 'ocean',
  sound: true,
  control: 'manual',
});

export const PREFERENCES_KEY = 'aritos.preferences.v1';
const FORMAT_VERSION = 1;
type PreferenceStorage = Pick<Storage, 'getItem' | 'setItem'>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validFallback(fallback: PlayerPreferences): PlayerPreferences {
  if (!isRecord(fallback)) return DEFAULT_PREFERENCES;
  return Object.freeze({
    model: isModel(fallback.model) ? fallback.model : DEFAULT_PREFERENCES.model,
    theme: isTheme(fallback.theme) ? fallback.theme : DEFAULT_PREFERENCES.theme,
    sound: typeof fallback.sound === 'boolean' ? fallback.sound : DEFAULT_PREFERENCES.sound,
    control: isControl(fallback.control) ? fallback.control : DEFAULT_PREFERENCES.control,
  });
}

function isModel(value: unknown): value is ToyModelId {
  return value === 'single-button' || value === 'two-button';
}

function isTheme(value: unknown): value is ThemeId {
  return value === 'ocean' || value === 'space' || value === 'capybaras';
}

function isControl(value: unknown): value is ControlPreference {
  return value === 'motion' || value === 'manual';
}

/** Parse only the supported, versioned preference format; invalid fields use the fallback. */
export function parsePreferences(
  serialized: string | null,
  fallback: PlayerPreferences = DEFAULT_PREFERENCES,
): PlayerPreferences {
  const defaults = validFallback(fallback);
  if (typeof serialized !== 'string' || serialized.length === 0) return defaults;

  try {
    const value: unknown = JSON.parse(serialized);
    if (!isRecord(value) || value.version !== FORMAT_VERSION || !isRecord(value.preferences)) return defaults;
    const p = value.preferences;
    return Object.freeze({
      model: isModel(p.model) ? p.model : defaults.model,
      theme: isTheme(p.theme) ? p.theme : defaults.theme,
      sound: typeof p.sound === 'boolean' ? p.sound : defaults.sound,
      control: isControl(p.control) ? p.control : defaults.control,
    });
  } catch {
    return defaults;
  }
}

/** Storage is resolved lazily so a throwing localStorage getter cannot block startup. */
export function createPreferenceStore(storage?: PreferenceStorage) {
  function resolveStorage(): PreferenceStorage | undefined {
    if (storage) return storage;
    try {
      return typeof globalThis.localStorage === 'undefined' ? undefined : globalThis.localStorage;
    } catch {
      return undefined;
    }
  }

  return Object.freeze({
    load(fallback: PlayerPreferences = DEFAULT_PREFERENCES): PlayerPreferences {
      const defaults = validFallback(fallback);
      try {
        return parsePreferences(resolveStorage()?.getItem(PREFERENCES_KEY) ?? null, defaults);
      } catch {
        return defaults;
      }
    },
    save(preferences: PlayerPreferences): boolean {
      try {
        const target = resolveStorage();
        if (!target) return false;
        const safe = validFallback(preferences);
        // Serialize a fresh allowlisted object. Round snapshots or other extra fields never escape.
        const serialized = JSON.stringify({
          version: FORMAT_VERSION,
          preferences: {
            model: safe.model,
            theme: safe.theme,
            sound: safe.sound,
            control: safe.control,
          },
        });
        target.setItem(PREFERENCES_KEY, serialized);
        return true;
      } catch {
        return false;
      }
    },
  });
}
