export type ThemeId = 'ocean' | 'space' | 'capybaras';
export type MascotId = 'octopus' | 'astronaut' | 'capybara';

export type ThemeAsset = Readonly<{ mimeType: 'image/svg+xml'; source: string }>;

export type ThemeDefinition = Readonly<{
  id: ThemeId;
  name: string;
  mascot: MascotId;
  /** Colors used by player controls so interface and toy stay visually coherent. */
  ui: Readonly<{ accent: string; accentText: string; surface: string; text: string; muted: string }>;
  colors: Readonly<{
    background: number;
    backgroundGlow: number;
    housing: number;
    housingEdge: number;
    water: number;
    waterDeep: number;
    button: number;
    buttonEdge: number;
    peg: number;
    base: number;
    rings: readonly number[];
    bubble: number;
    decoration: number;
  }>;
  /** Inline source is available to T10/T11 without a post-startup network request. */
  assets: Readonly<{ mascot: ThemeAsset }>;
}>;
