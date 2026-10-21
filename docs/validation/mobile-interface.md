# Mobile interface redesign — October 21, 2026

Candidate build **019e6188**, based on `4d6081f`. Status: implemented and verified locally; awaiting user review on their Pixel. The user subsequently authorized a GitHub push to update their dev lab. Deployment and physical Pixel review remain user follow-up.

## User problem and resulting behavior

The user's Pixel screenshots show a narrow toy inside a large stage, with substantial permanent UI above and below it. At a measured 393×710 desktop-browser viewport, the old stage was only 290px tall and the page was 999px tall. The new stage is 506px tall, and the whole game fits 710px. This is about 75% more stage height, without scrolling to reach either pump. The camera also fits the complete acrylic shell instead of reserving a large scenic margin.

- Compact play uses the available dynamic viewport height, safe-area padding, a 48px header, compact progress and a 104px portrait / 78px landscape pump deck. The two pumps stay below the stage; the one-button model keeps its central pump.
- **Inclinar** and **Mascota** open one nonmodal panel at a time. Pumping remains available and opening the panel does not pause. Both tilt axes, inversion, recentering, explicit sensor activation and both assists remain accessible. Short panels scroll internally; their close action stays sticky. Escape returns focus to the corresponding opener. Wide layout changes expose the original panels and preserve the round.
- In landscape, progress shares the header. The tools panel uses the space beside the portrait toy when available.
- Setup has compact model/mode cards and three illustrated theme previews. Short landscape uses two columns. **Jugar** is fully visible in all ten measured viewports; optional help may need scrolling on the smallest portrait screen.
- Existing dialogs still pause through session pause reasons. Restart cancellation, theme changes and decoration retain their existing contracts. Decoration actions have 44px targets and safe-area padding.
- Completed rounds close the tool panel and disable its openers, leaving the persistent **Nueva partida** action accessible. Starting a new round re-enables the controls.

The fixed 0.7° camera elevation, physical layout, twelve starting rings, strength 75, drag 0.50, both scoring rules and automatic linked villain are unchanged. `fitToyCameraDistance` changes rendering distance only and fits all eight outer-shell corners with four-percent screen-edge margins. Camera/sticker projection is recomputed by the existing ResizeObserver.

## Verification

**160/160 tests passed**, zero failures/skips, final run 33.627s. TypeScript, build and `git diff --check` passed. Two new camera tests project real Three.js bounding corners across phone/tablet/desktop aspect ratios and sample 350 browser-height changes for continuous framing. Existing input/physics/session/mascot/sticker tests remain passing. These are automated engine and UI-contract checks, not physical mobile acceptance.

Browser checks used the **Codex In-app Browser** on localhost (desktop viewport emulation; browser version is not exposed by its DOM inspector). Sources carried `app.js?v=019e6188`. Measurements were taken after responsive styles settled; temporary viewport overrides and test tabs were removed afterward.

| Viewport | Stage height | Game page scroll | Jugar fully visible |
| --- | ---: | --- | --- |
|320×568|364|None|Yes|
|360×640|436|None|Yes|
|393×710|506|None|Yes|
|430×900|696|None|Yes|
|568×320|186|None|Yes|
|667×375|241|None|Yes|
|844×390|256|None|Yes|
|768×1024|820|None|Yes|
|1024×768|634|None|Yes|
|1280×900|387|Normal desktop vertical scrolling|Yes|

All cases had no horizontal page overflow. Pump buttons were fully within the viewport, at least 44px high, and hit-testable at their centers. See [game rectangles](evidence/mobile-ui-layouts.json) and [setup rectangles](evidence/mobile-ui-setup-layouts.json).

Observed browser interactions:

- Ocean normal/two-button/collect: opened mascot panel and used the existing scripted helper; real base contact moved 0/12 to1/12. Tilt 25°/−35°, portrait-to-landscape rotation and restart cancellation retained 1/12 and both tilt values. The game resumed afterward. This proves this observed state transition, not all possible input sequences.
- Escape closed the panel and restored focus to `mascots-open`. Settings → Controles e inclinación opened the tilt panel and focused its explicit sensor button. Recenter worked. Manual tilt and pump activation were exercised with the panel open; this does not prove two independent fingers.
- At568×320, scrolling the panel 123.5px to reach recenter left **Cerrar herramientas** visible and hit-testable. Landscape844×390 put the panel beside the toy.
- Capybara one-button classic play and pumping were exercised. Final controlled physical stack previews completed capybara/one-button/collect at320×568 and space/two-button/classic at844×390. Both displayed a 44px **Nueva partida** action within the viewport. Clicking it restored0/12 and enabled controls; no score injection was used. Preview rewards remained in the isolated sandbox.
- The final preview's decoration panel exposed a 44px **Terminar** action; opening/closing preserved the round. No normal-user sticker placements were modified. No console errors were recorded in that controlled preview.

[Interaction record](evidence/mobile-ui-interactions.json). Normal test-round progress was discarded only in disposable test tabs; the user's original tab was still on setup before being updated to the new local build. Original two-button/space preferences were restored.

## Screenshots

- [Previous phone layout](evidence/mobile-ui-before.jpg) — build004a48ef,393×710.
- [Compact setup](evidence/mobile-ui-setup.jpg) and [larger game](evidence/mobile-ui-game.jpg) — final build,393×710.
- [Portrait tilt panel](evidence/mobile-ui-tilt.jpg) and [landscape panel](evidence/mobile-ui-landscape.jpg).
- [Collect victory](evidence/mobile-ui-victory-portrait.jpg),320×568; [classic victory](evidence/mobile-ui-victory-landscape.jpg),844×390.

## Remaining device review

The user supplied physical Pixel screenshots of the previous version; this iteration has not yet been checked on that device. Actual browser chrome/safe-area transitions, sensor permissions/calibration, independent multitouch, thumb comfort and sustained rendered FPS remain unverified on Pixel/Android/iOS hardware. Desktop resizing checks are not equivalent to rotating a phone. No paid service, account, tunnel, external font/library or deployment was added. User acceptance of this new layout is pending.
