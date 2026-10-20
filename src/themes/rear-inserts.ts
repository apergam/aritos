import type { ThemeAsset, ThemeId } from './types';

/** Bundled rear illustrations for the molded rear panel of the toy. */
export const REAR_INSERTS: Readonly<Record<ThemeId, string>> = Object.freeze({
  ocean: './assets/themes/ocean-reef-v2-9767a3f999.png',
  capybaras: './assets/themes/capybara-pond-v2-195c088f92.png',
  space: './assets/themes/space-nebula-v2-25760af803.png',
});

export const REAR_INSERT_ASSETS: Readonly<Record<ThemeId, ThemeAsset>> = Object.freeze(
  Object.fromEntries(Object.entries(REAR_INSERTS).map(([id, source]) => [id, Object.freeze({ mimeType: 'image/png' as const, source })])) as Record<ThemeId, ThemeAsset>,
);
