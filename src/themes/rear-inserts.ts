import type { ThemeAsset, ThemeId } from './types';

const svg = (content: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1400" viewBox="0 0 1000 1400">${content}</svg>`)}`;

/** Bundled rear illustrations for the molded rear panel of the toy. */
export const REAR_INSERTS: Readonly<Record<ThemeId, string>> = Object.freeze({
  ocean: './assets/themes/ocean-reef-v2-9767a3f999.png',
  capybaras: './assets/themes/capybara-pond-v2-195c088f92.png',
  space: svg(`
    <defs>
      <linearGradient id="nebula" x2="1" y2="1"><stop stop-color="#8e7be2" stop-opacity=".12"/><stop offset="1" stop-color="#28346f" stop-opacity=".54"/></linearGradient>
      <radialGradient id="clear"><stop stop-color="#b3c7ff" stop-opacity=".02"/><stop offset=".62" stop-color="#b3c7ff" stop-opacity=".03"/><stop offset="1" stop-color="#b3c7ff" stop-opacity=".56"/></radialGradient>
    </defs>
    <path fill="url(#nebula)" d="M0 0h1000v1400H0z"/><path fill="url(#clear)" d="M0 0h1000v1400H0z"/>
    <g fill="#fff4be" opacity=".86"><circle cx="93" cy="154" r="8"/><circle cx="222" cy="284" r="5"/><circle cx="855" cy="152" r="7"/><circle cx="916" cy="337" r="5"/><circle cx="83" cy="626" r="6"/><circle cx="905" cy="754" r="8"/><circle cx="128" cy="1022" r="7"/><circle cx="883" cy="1117" r="6"/><circle cx="735" cy="270" r="4"/><circle cx="317" cy="115" r="4"/></g>
    <g stroke="#d4d5ff" stroke-width="9" stroke-linecap="round" opacity=".65"><path d="M93 194v45m-22-22h44M855 190v44m-22-22h44M83 651v38m-19-19h38M905 790v45m-22-22h44M883 1150v38m-19-19h38"/></g>
    <g opacity=".82"><circle cx="151" cy="436" r="91" fill="#ec8a70"/><path d="M71 410q76-47 160-11m-150 80q74-35 139-9" fill="none" stroke="#ffca91" stroke-width="18" opacity=".74"/><ellipse cx="151" cy="436" rx="126" ry="36" fill="none" stroke="#ffd78c" stroke-width="11" transform="rotate(-19 151 436)"/>
      <circle cx="858" cy="560" r="118" fill="#7bb9d6"/><path d="M770 527q67-38 121-5 37 24 74 4m-161 65q57-23 101 1 36 20 76-2" fill="none" stroke="#c6f1e8" stroke-width="17" opacity=".72"/><ellipse cx="858" cy="560" rx="163" ry="46" fill="none" stroke="#b9bcff" stroke-width="10" transform="rotate(17 858 560)"/>
    </g>
    <g opacity=".87" stroke-linejoin="round">
      <g transform="translate(18 898) rotate(-18 122 140)"><path d="M122 28q26 46 29 113l85 72-6 20-91-37-14 126h-23l-15-126-91 37-6-20 85-72q4-67 29-113z" fill="#e9efff" stroke="#9499d8" stroke-width="9"/><path d="M111 106h23v64h-23z" fill="#f6bc6b"/><path d="M109 321h25l36 59h-97z" fill="#f18a73"/></g>
      <g transform="translate(742 758) rotate(19 116 126) scale(.82)"><path d="M116 25q25 43 29 106l80 69-7 20-86-34-13 120h-23L82 186l-85 34-7-20 79-69q4-63 29-106z" fill="#c9f1eb" stroke="#7daac2" stroke-width="9"/><circle cx="116" cy="124" r="19" fill="#6057a9"/><path d="M105 306h24l33 52H75z" fill="#ffa857"/></g>
    </g>
    <g fill="none" stroke="#b2a6f5" stroke-width="8" opacity=".55"><path d="M0 1320q120-65 245 0t253 0m310 3q100-52 192-3"/><path d="M15 1350q102-40 202 0m573 1q100-48 195-1"/></g>
  `),
});

export const REAR_INSERT_ASSETS: Readonly<Record<ThemeId, ThemeAsset>> = Object.freeze(
  Object.fromEntries(Object.entries(REAR_INSERTS).map(([id, source]) => [id, Object.freeze({ mimeType: id !== 'space' ? 'image/png' as const : 'image/svg+xml' as const, source })])) as Record<ThemeId, ThemeAsset>,
);
