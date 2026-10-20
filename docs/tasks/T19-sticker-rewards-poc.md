# T19 — Prototype earned toy stickers

Dependencies: T03, T05, T08, T11. Unavailable physical devices do not block exploration; record those checks as not run.

Read [AGENTS.md](../../AGENTS.md), [requirements section 16](../requirements.md#16-first-version-feedback-and-polish-backlog--october-20-2026), the [implementation guide](../implementation-guide.md), [module contracts](../module-contracts.md), and [task board](README.md) before assignment. This card is planned; recording it does not start an agent or implementation.

## Outcome and ownership

Explore awarding a decorative sticker that the player can place on their toy. Own a new sticker feature with clearly defined placement/persistence interfaces; coordinate session events, UI, renderer and preferences through the integration owner. The unlock schedule is not yet decided.

## Work and acceptance

- First propose the smallest reward rule and eligible sticker catalog. A first completed round is a candidate, not an already agreed economy. Record the chosen trigger before implementing permanent unlocks; no currencies, store, accounts or purchases.
- Prototype earning one sticker from a real completed round, then placing, moving and removing it on the toy. Preview or ordinary pump/collection actions must not silently grant permanent rewards.
- Support placement across the toy surface requested by the player, with normalized toy-relative coordinates that survive resize/orientation. Do not place stickers on menus/buttons; placement mode pauses the round and prevents accidental pumping.
- Compare layering/opacity so stickers do not make ring holes or peg tips unreadable. Provide a way to recover, move or remove an obstructing sticker without resetting the round.
- Persist only agreed unlock/decorative data with validation and storage-failure fallback; do not serialize physics or progress. A round must not award the same unlock repeatedly.
- Decide and document whether stickers are global or theme-specific and how they behave on model/theme switches. Keep artwork provenance and all resources local.

## Verification and handoff

Exercise a genuine victory, duplicate/restarted events, reload, malformed/unavailable storage, theme/model switches and placement in portrait/landscape. Test pointer cancellation and placement versus pump inputs. Record open reward decisions and user feedback; run code checks after implementation.

Coverage: BL-12; requirements section 16 is a bounded extension to RF-36 and RF-44; keep RF-37 and no-account scope.
