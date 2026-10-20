import type { MascotId, ThemeDefinition, ThemeId } from './types';
export type { MascotId, ThemeAsset, ThemeDefinition, ThemeId } from './types';

const svg = (mascot: MascotId, body: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" role="img" aria-label="${mascot}">${body}</svg>`)}`;

const definitions: Record<ThemeId, ThemeDefinition> = {
  ocean: Object.freeze({
    id: 'ocean', name: 'Océano', mascot: 'octopus',
    ui: Object.freeze({ accent: '#087f8c', accentText: '#ffffff', surface: '#e6f7f6', text: '#123c49', muted: '#557782' }),
    colors: Object.freeze({ background: 0x9cdee2, backgroundGlow: 0xe6fffb, housing: 0x38b9b3, housingEdge: 0x087e88, water: 0x8ce5dd, waterDeep: 0x248ea0, button: 0xf6b956, buttonEdge: 0xb96839, peg: 0xf7d58d, base: 0xe9b96c, rings: Object.freeze([0xff704f, 0xffc24a, 0x24b7af, 0x627fe8, 0xf05b98, 0xb2dc55, 0x845dd0]), bubble: 0xeaffff, decoration: 0xefffff }),
    assets: Object.freeze({ mascot: Object.freeze({ mimeType: 'image/svg+xml', source: svg('octopus', '<path fill="#ef755f" d="M80 27c-23 0-39 17-39 39 0 13 6 23 16 29-3 13-15 18-11 27 5 11 21 0 25-16 5 2 11 3 17 2 3 14 18 25 25 15 6-10-6-17-9-29 10-8 16-19 16-32 0-20-17-35-40-35z"/><circle cx="66" cy="66" r="5" fill="#18364b"/><circle cx="94" cy="66" r="5" fill="#18364b"/><path d="M69 82q11 10 22 0" fill="none" stroke="#18364b" stroke-width="4" stroke-linecap="round"/><path d="M51 104q-15 5-15 18m67-17q16 4 17 17" fill="none" stroke="#ef755f" stroke-width="9" stroke-linecap="round"/>') }) }),
  }),
  space: Object.freeze({
    id: 'space', name: 'Espacio', mascot: 'astronaut',
    ui: Object.freeze({ accent: '#6145ba', accentText: '#ffffff', surface: '#f0edff', text: '#252347', muted: '#696585' }),
    colors: Object.freeze({ background: 0x171a3f, backgroundGlow: 0x4a3978, housing: 0x8879d9, housingEdge: 0x493b99, water: 0x6967c6, waterDeep: 0x332b80, button: 0xffb64d, buttonEdge: 0x9b5593, peg: 0xffd58d, base: 0xe1a970, rings: Object.freeze([0x55d7e8, 0xff65b7, 0xf9c74f, 0xa188ff, 0x74e0ac, 0xf17b64, 0xe9edff]), bubble: 0xc3f7ff, decoration: 0xf5efff }),
    assets: Object.freeze({ mascot: Object.freeze({ mimeType: 'image/svg+xml', source: svg('astronaut', '<circle cx="80" cy="80" r="65" fill="#8e85d8"/><path d="M48 63h-9v27h9m64-27h9v27h-9" fill="none" stroke="#ddd8ff" stroke-width="8"/><path fill="#f5f4ff" d="M80 25c-25 0-42 17-42 42v33c0 17 17 30 42 30s42-13 42-30V67c0-25-17-42-42-42z"/><rect x="51" y="48" width="58" height="43" rx="20" fill="#324c82" stroke="#c7f3ff" stroke-width="5"/><circle cx="68" cy="66" r="5" fill="#fff"/><circle cx="92" cy="66" r="5" fill="#fff"/><path d="M56 108h48m-39 15h30" stroke="#9d91e8" stroke-width="8" stroke-linecap="round"/><path d="m48 37-7-14m71 14 7-14" stroke="#f6bb54" stroke-width="7" stroke-linecap="round"/>') }) }),
  }),
  capybaras: Object.freeze({
    id: 'capybaras', name: 'Capibaras', mascot: 'capybara',
    ui: Object.freeze({ accent: '#71894a', accentText: '#ffffff', surface: '#f1f5e7', text: '#34412b', muted: '#68745d' }),
    colors: Object.freeze({ background: 0xb8cf93, backgroundGlow: 0xf1e2ae, housing: 0x9cbd70, housingEdge: 0x597a43, water: 0xb5d9b1, waterDeep: 0x658a68, button: 0xf2a45e, buttonEdge: 0x925939, peg: 0xf0d4a0, base: 0xc99a62, rings: Object.freeze([0xe87852, 0xeebc4e, 0x71a9c3, 0x899b50, 0xc4789a, 0xe7d08a, 0x756aaa]), bubble: 0xfff8d8, decoration: 0xfff5da }),
    assets: Object.freeze({ mascot: Object.freeze({ mimeType: 'image/svg+xml', source: svg('capybara', '<ellipse cx="80" cy="91" rx="54" ry="39" fill="#b77c51"/><path d="M44 77c-2-25 13-42 37-42 25 0 41 18 37 47-9 15-23 24-42 24-15 0-25-8-32-29z" fill="#c78c5f"/><ellipse cx="109" cy="78" rx="24" ry="18" fill="#d9a675"/><ellipse cx="129" cy="84" rx="11" ry="8" fill="#754b3b"/><circle cx="72" cy="63" r="4" fill="#292c28"/><path d="M54 48q-10-18-17-3m54 1q10-18 17-3" fill="#8e5d43" stroke="#8e5d43" stroke-width="8" stroke-linecap="round"/><path d="M54 115v17m68-17v17" stroke="#80543e" stroke-width="10" stroke-linecap="round"/><path d="M38 113q-11 10-2 17" fill="none" stroke="#75a35f" stroke-width="5" stroke-linecap="round"/>') }) }),
  }),
};

export const THEMES: Readonly<Record<ThemeId, ThemeDefinition>> = Object.freeze(definitions);
export function theme(id: ThemeId): ThemeDefinition { return THEMES[id]; }
