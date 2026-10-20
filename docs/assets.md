# Player assets and offline strategy

Themes and mascot art are defined in `src/themes/index.ts`. The octopus, astronaut and capybara are project-native inline SVG drawings embedded as data URIs; ocean plants/waves, space stars/planet and capybara reeds/lily pads are procedural Three.js geometry. UI controls use CSS and inline vector/system emoji shapes. No third-party image or recording was downloaded for this iteration.

All effects in `src/audio/audio-controller.ts` are Web Audio oscillator/gain synthesis. `AUDIO_ASSET_MANIFEST` has no network assets. Celebration uses the theme's inline SVG and local `public/celebration.css`; it does not fetch art on victory.

The build bundles all theme/art definitions and Rapier/WASM with application code, copies local CSS, uses system fonts and versions the shared static entries by content hash. No remote font import remains. Theme changes and play after complete loading require no serving-origin requests. No service worker, installation or cold offline launch is implemented.

Pinned renderer/physics packages retain their upstream licenses, confirmed from local package metadata: Three.js 0.180.0 (`MIT`), `@dimforge/rapier3d-compat` 0.19.3 (`Apache-2.0`). Keep their license notices when redistributing. This document records provenance rather than an external asset clearance review.
