# Persistent round completion — October 21, 2026

## Report and reproduction

The user reached 12/12 in normal collect play and saw an empty toy, no noticeable celebration and no new-game action. A controlled `/preview.html?scene=stack` run of the unchanged build20eb133f reproduced the dead end through genuine physical collection.

Immediately at 12/12, DOM inspection reported `celebration: active`, the success toast and **zero Nueva partida buttons**. After the existing four-second lifetime, the same page reported `celebration: idle`, hidden toast, 12/12 and still zero new-game buttons. A browser assertion failed with `RED: 12/12 has no Nueva partida action after victory feedback expires`. This was a minimal completed-round reproduction, without altering physics or injecting progress.

The ranked hypotheses were presented before comparative work: transient feedback expires leaving no outcome; the small corner animation is too easy to miss; or a victory event is missed on some path. The controlled run confirms the first cause. It does **not** prove the animation/event failed in the user's exact session. An event-missing path was not reproduced, so it is not described as an established cause.

## Change

- A persistent, themed result card is derived from the authoritative `snapshot.won`, with “¡Lo lograste!”, the actual round target and **Nueva partida**.
- The locally bundled theme artwork performs a short cheer; existing confetti and celebration remain once per round. Reduced-motion styling disables the new artwork animation.
- The card remains after transient feedback expires. The frame loop reconciles the visual celebration from won state as a fallback; the existing controller deduplicates repeated events and does not replay after expiry.
- Nueva partida resets the round with the same model/mode/theme and approved geometry/tuning. The existing fresh-round path preserves saved preferences/stickers and resets round-specific mascot state. Manual pause is cleared for this explicit new-game action; hidden-page pause remains governed by visibility.
- Completed rounds disable pump buttons and pump commands. The transient victory toast is hidden behind the persistent result instead of duplicating its heading.
- Keyboard focus moves to Nueva partida once on completion. Starting play restores the app into view so a scroll used to reach Jugar does not leave the finished toy offscreen. Compact layouts keep the whole action inside the card with at least 44 CSS pixels of button height.

The ongoing ring-chain investigation and diagnostic files are untouched. No change to collision shapes, pumping strength, collection rules, ring counts or mascot mechanics was needed.

## Verification

- Full suite: **147/147 passed**, zero failures/skips. The focused round-result/celebration tests were rerun after the final focus adjustment: **4/4 passed**.
- `node node_modules/typescript/bin/tsc --noEmit`: passed.
- `node build.mjs`: passed, revision **08cfeebd**.
- `git diff --check`: passed.

New tests use real selected-layout physics to complete rounds for both models and rules, omit event delivery deliberately, reconcile the celebration once, let eight seconds elapse and verify the result/action remain. They cover double activation, a clean twelve-ring restart, model/mode/layout preservation, dynamic target copy (14), all three bundled illustrations and listener disposal.

Browser checks of the actual built preview verified:

1. Space/two-button/collect: visible result at 12/12; after confetti expired, card/action remained. Clicking Nueva partida showed 0/12, hidden result and enabled pumps; a later completion showed the result again.
2. Ocean/single-button/classic: 12/12, correct classic wording and octopus art; active celebration at the physical win.
3. Capybaras/two-button/collect: correct collection wording/capybara art; active celebration at the physical win.
4. 360×640 portrait and 844×390 landscape: button wholly inside card and viewport, 44px minimum height, no horizontal page overflow. This exposed a compact-card crop that was corrected and rechecked. Temporary viewport overrides were reset.
5. No browser console errors were reported.

Evidence: [desktop](evidence/round-completion-desktop.png), [portrait](evidence/round-completion-360x640.png), [landscape](evidence/round-completion-844x390.png), [DOM checks](evidence/round-completion-browser.json).

Previews retain their isolated sticker sandbox. These browser viewport checks do not establish physical Android/iOS sensor, multitouch, FPS or subjective audio acceptance. No deployment or push was performed.
