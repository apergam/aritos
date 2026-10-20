# T17 — Explore themed ring appearance

Dependencies: T08, T11. Unavailable physical devices do not block exploration; record those checks as not run.

Read [AGENTS.md](../../AGENTS.md), [requirements section 16](../requirements.md#16-first-version-feedback-and-polish-backlog--october-20-2026), the [implementation guide](../implementation-guide.md), [module contracts](../module-contracts.md), and [task board](README.md) before assignment. This card is planned; recording it does not start an agent or implementation.

## Outcome and ownership

Explore ring colors and decorative designs that match each theme. Start with palettes/materials and compare optional decorative motifs. Own theme ring definitions and visual meshes; coordinate renderer ownership with T16.

## Work and acceptance

- Supply distinguishable palettes for ocean, space and capybaras; optionally compare small theme motifs on the ring surface.
- Keep the existing physical dimensions, open hole and collider geometry. Decoration must not imply solid protrusions or a changed hole that physics does not model. Shape-changing rings would require a separate physics task.
- Preserve clear silhouettes against T16's rear insert when available; this task can start with current backgrounds and recheck the combined result afterward.
- Apply appearance to existing stable ring IDs without recreating bodies, resetting progress, changing difficulty or introducing color-based scoring.
- Compare both toy models and all three themes, including many overlapping rings, and record the selected visual direction with the user. Keep resources local and document provenance.

## Verification and handoff

Check screenshots and theme switches with moving/threaded rings, including before/after physical-state comparison. Run code checks if rendering changes; do not add tests that merely restate palette constants. Verify reduced graphics and resource disposal remain functional.

Coverage: BL-11; RF-03, RF-08, RF-34–RF-37; CA-11–CA-12.
