import type { ThemeAsset, ThemeId } from './types';

const svg = (content: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1400">${content}</svg>`)}`;

/** Original, bundled vector scenes for the molded rear panel of the toy. */
export const REAR_INSERTS: Readonly<Record<ThemeId, string>> = Object.freeze({
  ocean: svg(`
    <defs>
      <linearGradient id="sea" x2="0" y2="1"><stop stop-color="#8ce8df" stop-opacity=".14"/><stop offset="1" stop-color="#167e91" stop-opacity=".55"/></linearGradient>
      <radialGradient id="clear"><stop stop-color="#b9fff0" stop-opacity=".03"/><stop offset=".62" stop-color="#b9fff0" stop-opacity=".04"/><stop offset="1" stop-color="#b9fff0" stop-opacity=".55"/></radialGradient>
      <linearGradient id="coral"><stop stop-color="#ffb46c"/><stop offset="1" stop-color="#e66f65"/></linearGradient>
    </defs>
    <path fill="url(#sea)" d="M0 0h1000v1400H0z"/><path fill="url(#clear)" d="M0 0h1000v1400H0z"/>
    <g opacity=".56" fill="none" stroke-linecap="round">
      <path stroke="#ffe29a" stroke-width="12" d="M42 1180q130-34 270 4M706 1270q130-42 252-4M63 1270q115-25 208 8"/>
      <path stroke="#3baf9a" stroke-width="20" d="M38 1320q30-125 7-245m15 150q48-94 112-112m-123 79q-52-93-30-142m857 296q-15-125 10-234m-8 142q-61-93-126-107m131 65q45-90 34-136"/>
      <path stroke="#65c7ad" stroke-width="12" d="M109 1395q25-154 95-224m-2 173q67-69 121-68m548 122q-8-137-86-225m4 165q-58-57-114-62"/>
    </g>
    <g fill="#ff9d73" opacity=".84"><path d="M0 1370q64-58 113-6 30-92 82-63 42-89 85-32l29 131H0zm1000-8q-48-65-97-10-20-84-75-65-35-89-81-28l-27 141h280z"/></g>
    <g fill="#e8d88e" opacity=".68"><path d="M0 1394q87-40 178-8t180 2v12H0m642-8q100-46 178-4t180 1v17H642"/></g>
    <g fill="none" stroke="#f5cf75" stroke-width="12" opacity=".8"><path d="M80 430q28-90 66 0-38 94-66 0zm68 3q24-77 54 0-30 78-54 0zM837 682q30-96 69 0-39 91-69 0zm53 6q24-76 51 0-27 74-51 0z"/></g>
    <g fill="#f29a6e" opacity=".72"><path d="M112 566q-35-50-68-4 33 42 68 4l47 21-46 20q-26 39-59 3 22-48 58-23zM820 930q-31-47-65-3 31 40 65 3l47 18-45 22q-24 37-58 4 20-46 56-24z"/></g>
    <g fill="none" stroke="#d8fff1" stroke-width="9" opacity=".45"><circle cx="154" cy="760" r="12"/><circle cx="188" cy="690" r="7"/><circle cx="851" cy="510" r="11"/><circle cx="810" cy="468" r="6"/><circle cx="105" cy="905" r="7"/><circle cx="890" cy="1070" r="8"/></g>
  `),
  capybaras: svg(`
    <defs>
      <linearGradient id="habitat" x2="0" y2="1"><stop stop-color="#e6d69e" stop-opacity=".1"/><stop offset=".7" stop-color="#9ec78a" stop-opacity=".17"/><stop offset="1" stop-color="#6b9c73" stop-opacity=".55"/></linearGradient>
      <radialGradient id="clear"><stop stop-color="#f5f0d5" stop-opacity=".02"/><stop offset=".6" stop-color="#f5f0d5" stop-opacity=".04"/><stop offset="1" stop-color="#f5f0d5" stop-opacity=".5"/></radialGradient>
    </defs>
    <path fill="url(#habitat)" d="M0 0h1000v1400H0z"/><path fill="url(#clear)" d="M0 0h1000v1400H0z"/>
    <g opacity=".66" stroke-linecap="round" fill="none">
      <path stroke="#537b4d" stroke-width="18" d="M35 1180q17-255-12-465m28 322q64-154 132-179m-152 96q-68-134-35-202m899 487q-24-236 14-476m-6 313q-64-145-141-164m150 81q55-124 41-198"/>
      <path stroke="#7b9f58" stroke-width="12" d="M110 1395q7-222 78-370m-7 240q64-76 124-81m548 211q-10-203-82-357m7 234q-68-75-124-82"/>
    </g>
    <g fill="#7ca95b" opacity=".62"><ellipse cx="115" cy="1240" rx="72" ry="24" transform="rotate(-23 115 1240)"/><ellipse cx="851" cy="1278" rx="80" ry="26" transform="rotate(24 851 1278)"/><ellipse cx="60" cy="1090" rx="58" ry="19" transform="rotate(28 60 1090)"/><ellipse cx="938" cy="1103" rx="58" ry="19" transform="rotate(-28 938 1103)"/></g>
    <g opacity=".82">
      <g transform="translate(24 806)"><ellipse cx="94" cy="113" rx="98" ry="63" fill="#a66f4d"/><path d="M23 92q-5-74 59-85 70-9 83 63l42 25-46 35H77z" fill="#bd855d"/><ellipse cx="197" cy="102" rx="35" ry="25" fill="#d5a176"/><ellipse cx="224" cy="105" rx="11" ry="8" fill="#4b4439"/><circle cx="126" cy="75" r="6" fill="#352d28"/><path d="M69 40q-17-24-27 1m78-15q20-30 28-2" fill="#885b42" stroke="#885b42" stroke-width="13" stroke-linecap="round"/><path d="M52 163v37m120-37v37" stroke="#80543b" stroke-width="17" stroke-linecap="round"/></g>
      <g transform="translate(740 1000) scale(.76)"><ellipse cx="94" cy="113" rx="98" ry="63" fill="#9d684a"/><path d="M23 92q-5-74 59-85 70-9 83 63l42 25-46 35H77z" fill="#b9815b"/><ellipse cx="197" cy="102" rx="35" ry="25" fill="#d5a176"/><ellipse cx="224" cy="105" rx="11" ry="8" fill="#4b4439"/><circle cx="126" cy="75" r="6" fill="#352d28"/><path d="M69 40q-17-24-27 1m78-15q20-30 28-2" fill="#885b42" stroke="#885b42" stroke-width="13" stroke-linecap="round"/><path d="M52 163v37m120-37v37" stroke="#80543b" stroke-width="17" stroke-linecap="round"/></g>
    </g>
    <g fill="none" stroke="#6b9da0" stroke-width="10" opacity=".5"><path d="M0 1260q105-40 205 0t204 0m391 0q105-40 200 0"/><path d="M0 1310q90-25 166 1m578 4q111-35 256 0"/></g>
    <g fill="#f1df9f" opacity=".65"><path d="M128 730q30-60 60 0-30 56-60 0zm755-240q24-50 49 0-25 46-49 0zM168 610q20-40 40 0-20 38-40 0z"/></g>
  `),
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
  Object.fromEntries(Object.entries(REAR_INSERTS).map(([id, source]) => [id, Object.freeze({ mimeType: 'image/svg+xml' as const, source })])) as Record<ThemeId, ThemeAsset>,
);
