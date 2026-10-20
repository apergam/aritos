# Integrated module contracts — player and laboratory

These are the executable seams in the extracted POC. The public signatures below are the TypeScript exports; omitted implementation details stay owned by the named module. Player-facing copy stays Spanish. Rapier remains 0.19.3 and Three.js remains 0.180.0.

## Physics

`src/physics/simulation.ts` owns Rapier initialization, colliders, fixed-step dynamics, pump flows, 3D threading tests, actual pedestal contact, and collection removal. `src/physics.ts` is the compatibility facade and re-exports the simulation module so existing tests and POC consumers can keep importing `../src/physics`.

```ts
export const DT: number;
export const TANK: { x: number; y: number; z: number };
export const RING: { radius: number; tube: number; segments: number };
export const PEGS: { x: number; z: number }[];
export const BASE: number;
export const TIP: number;
export const PULSE_DURATION: number;
export const JETS: Record<PumpSide, { origin: Vec; direction: Vec }>;
export type Scene = 'free' | 'drop' | 'stack' | 'depth';
export type GameMode = 'classic' | 'collect';
export type Vec = { x: number; y: number; z: number };
export type Ring = { body: RAPIER.RigidBody; id: number };
export type PumpSide = 'left' | 'right' | 'center';
export function initPhysics(): Promise<void>;
export class Simulation {
  world: RAPIER.World; rings: Ring[]; pulses: { side: PumpSide; left: number }[];
  gravity: Vector3; strength: number; drag: number; time: number; model: number;
  stableTime: number; won: boolean; onWin?: () => void; escaped: boolean;
  mode: GameMode; collected: number; totalRings: number;
  addRing(x: number, y: number, z: number, rotation?: Quaternion): Ring;
  reset(scene?: Scene): void;
  setGravity(gravity: Vec): void;
  pump(side: PumpSide): void;
  isThreaded(ring: Ring): boolean;
  readonly count: number;
  step(): void;
  dispose(): void;
  // Readouts used by composition/lab: world, rings, pulses, gravity, strength,
  // drag, time, model, count, collected, totalRings, stableTime, won, escaped.
}
export function gravityFromOrientation(beta: number, gamma: number, screenAngle?: number): Vector3;
export function calibratedGravity(raw: Vector3, calibration: Quaternion, magnitude?: number): Vector3;
```

The fixed step remains 1/120 s. The accepted tuning remains strength 75, drag 0.50, 1.8 interior depth, floor-supported bases, and lower side jets. Collection still requires the ring to be threaded and in measured Rapier contact with a pedestal for 0.12 active physics seconds. Classic mode retains physical rings and the original two-second simultaneous threading rule.

## Session and round rules

`src/game/session.ts` wraps the physics adapter with round identity, rules-facing events, readonly presentation snapshots, and independent pause reasons. The app owns frame accumulation and invokes exactly one `step()` per fixed tick.

```ts
export type PauseReason = 'manual' | 'menu' | 'document-hidden' | 'restart-confirmation';
export type SessionCommand =
  | { type: 'pump'; side: PumpSide }
  | { type: 'orient'; gravity: Vec }
  | { type: 'pause'; reason: PauseReason; paused: boolean }
  | { type: 'start'; options?: SessionOptions }
  | { type: 'set-model'; model: ToyModelId; scene?: Scene }
  | { type: 'set-mode'; mode: GameMode; scene?: Scene }
  | { type: 'restart'; scene?: Scene };
export type RingPose = Readonly<{
  id: number; position: Readonly<Vec>;
  rotation: Readonly<{ x: number; y: number; z: number; w: number }>;
  threaded: boolean;
}>;
export type SessionSnapshot = Readonly<{
  roundId: number; scene: Scene; model: ToyModelId; mode: GameMode;
  rings: readonly RingPose[]; total: number; active: number; collected: number;
  activeSeconds: number; paused: readonly PauseReason[]; won: boolean; escaped: boolean;
}>;
export type GameEvent =
  | { type: 'pump'; roundId: number; side: PumpSide }
  | { type: 'ring-collected'; roundId: number; ringId: number; collected: number; total: number }
  | { type: 'victory'; roundId: number; mode: GameMode };
export class GameSession {
  constructor(options?: { scene?: Scene; model?: ToyModelId; mode?: GameMode });
  readonly simulation: Simulation; // compatibility/lab access during the POC migration
  subscribe(listener: (event: GameEvent) => void): () => void;
  dispatch(command: SessionCommand): void;
  startRound(options?: { scene?: Scene; model?: ToyModelId; mode?: GameMode }): void;
  step(): void;
  snapshot(): SessionSnapshot;
  readonly isPaused: boolean;
  readonly pauseReasons: readonly PauseReason[];
  dispose(): void;
}
```

Ring IDs are stable inside a round; consumers pair them with `roundId` because a restart intentionally reuses the local sequence. Snapshots copy and freeze poses so render code cannot retain a removed Rapier body. Victory is emitted once per round and carries the round ID for stale-event filtering. Removing one pause reason leaves all other reasons active. A new round closes menu/restart-confirmation pauses, while preserving manual/document-hidden pauses. Canceling confirmation removes only its pause reason and does not restart. Model and mode commands always start a fresh round. Victory is queued during a physics tick and emitted only after the tick returns and collection events have been delivered. A listener may then restart or dispose safely; stale listeners/events are suppressed after round changes.

## Toy models

`src/models/toy-model.ts` contains mechanics only. It exports `ToyModelId = 'single-button' | 'two-button'`, `PumpSide`, `ToyVector`, `ToyOutlet`, `ToyPhysicsConfig`, `TOY_PHYSICS`, `TOY_OUTLETS`, `TOY_MODELS`, and `toyModel(id)`.

Each readonly model has `id`, `buttonCount`, `pumpSides`, `outlets` (side IDs), `outletDefinitions` (positions/directions), and `physics` (shared accepted configuration). Physics compatibility exports reference the registry's tank, ring, pegs, base, tip, pulse duration and outlets; strength/drag use its defaults. The lab consumes model IDs for visible outlets and controls consume pump mappings. The session rejects pumps outside the selected model. Both variants retain twelve free-play rings and two pegs; no theme fields enter mechanics.

## Input

`src/input/poc-controls.ts` owns the current POC pointer/keyboard handlers and held-key manual tilt, returning all listeners to the module for cleanup.

```ts
export type PocInputActions = Readonly<{
  model(): ToyModelId; paused(): boolean; pump(side: PumpSide): void;
  togglePause(): void; setManualTilt(roll: number, pitch: number): void;
}>;
export class PocControls {
  constructor(actions: PocInputActions, buttons: Partial<Record<PumpSide, HTMLElement>>, target?: Window);
  update(elapsedSeconds: number): void;
  resetTilt(roll?: number, pitch?: number, publish?: boolean): void;
  syncTilt(roll: number, pitch: number): void;
  dispose(): void;
}
export class PocMotionControls {
  readonly gravity: THREE.Vector3;
  readonly sensorMode: boolean;
  readonly state: MotionControlState;
  readonly hasSensorData: boolean;
  readonly capabilityMessage: string;
  constructor(elements: { button: HTMLElement; status: HTMLElement; rollValue: HTMLInputElement; pitchValue: HTMLInputElement; rollLabel: HTMLElement; pitchLabel: HTMLElement; target?: Window; sensorTimeoutMs?: number; onGravity?: (gravity: THREE.Vector3) => void });
  enable(): Promise<void>; center(): void; invert(): void;
  setManual(roll: number, pitch: number): void;
  dispose(): void;
}
```

`PocMotionControls` owns explicit permission activation, sensor listeners, calibration, screen remapping, manual sliders and a data watchdog. `MotionControlState` is `manual | unavailable | waiting | usable | denied | unusable-data`. Manual selection and disposal invalidate pending permission results. Centering an active sensor calibrates it without switching to manual. Screen changes preserve current gravity while rebasing orientation coordinates. Silence or repeated invalid samples leave a documented manual path. Real physical calibration remains subject to T06.

Pointer down and non-repeating keyboard press each issue one pulse; Space issues both sides simultaneously on the two-button model. Focused pump buttons support Space/Enter and assistive activation. Release, cancel, blur, hidden-page and teardown paths clear held state. `INPUT_HELP` and `INPUT_SHORTCUTS` export Spanish help for future player UI.

## Rendering and UI

`src/rendering/poc-renderer.ts` exports the internal `PocRingRenderer(scene: THREE.Scene)`, which owns torus geometry, per-ring materials, stable-ID mesh creation/removal, transforms, and threaded highlighting. It consumes values only; Rapier body references do not cross this seam.

`src/lab/poc-lab.ts` exports `PocLab(viewport: HTMLElement, model: ToyModelId)`. Its `cameraSnapshot(): CameraSnapshot`, `updateOutlets(model: ToyModelId)`, `resize()`, `render(snapshot, simulation)`, and `dispose()` methods own the complete POC Three scene, fixed lab camera and controls, tank/pegs/jets, pump bubbles, gravity arrow, collision debug draw, renderer sizing, and graphics cleanup. It composes `PocRingRenderer` internally. `render` accepts the readonly session snapshot plus the physics adapter only for laboratory debug output and active pump effects.

`src/ui/poc-view.ts` exports `renderPocStatus(root: ParentNode, snapshot: SessionSnapshot): void`; it projects mode, progress, and escape status into the current Spanish POC readouts. `src/main.ts` remains composition: it wires reset/model/mode/pause controls, commands, session events, fixed-step timing, diagnostics export, and teardown across the session, input, lab, and UI modules.

## Platform preferences

`src/platform/preferences.ts` exports `PlayerPreferences`, `ThemeId = 'ocean' | 'space' | 'capybaras'`, `ControlPreference = 'motion' | 'manual'`, `DEFAULT_PREFERENCES`, `PREFERENCES_KEY`, `parsePreferences(serialized, fallback?)`, and `createPreferenceStore(storage?)`.

The versioned payload is `{ version: 1, preferences: { model, theme, sound, control } }`. Missing, malformed, unsupported and partially invalid data falls back safely. Storage is resolved lazily and both getter/method failures are caught. `save` rebuilds an allowlist, so snapshots and progress cannot be persisted.

The laboratory loads the saved model before constructing a fresh collect round and saves explicit model/control choices. Reload restores no body, progress, rule mode or pause. A saved motion preference does not request sensor access automatically. Theme and sound choices can be stored for later UI; theme/audio implementation may proceed alongside free T06 validation under requirements section 15.

```ts
const store = createPreferenceStore();
const prefs = store.load();
const session = new GameSession({ model: prefs.model, mode: 'collect' });
// Explicit model selection starts a fresh round, then persists the choice.
session.dispatch({ type: 'set-model', model: 'single-button' });
store.save({ ...prefs, model: 'single-button' });
// A later theme or sound preference update only calls save, not startRound.
```

## Integration and remaining validation

`src/main.ts` composes these modules into the existing lab, using session pause state, registry model mappings and safe preferences. It clears frame accumulation on round/pause/visibility transitions, bounds catch-up to twelve ticks, and owns teardown of subscriptions, animation, window/DOM listeners and pending visual feedback. Hidden return does not replay a backlog.

T07–T11 will build and wire production UI/appearance/audio against these contracts after their code dependencies, independently of T06 completion. T06 runs free validation in parallel and coordinates defects through each module owner. The four laboratory scenes, camera tools, diagnostics and accepted tuning remain available. Automated and desktop checks are recorded in the task board and integration report; they do not establish Android/iOS sensors, independent touch contacts or mobile FPS.


## Player composition after T11

- `src/main.ts` selects the explicit page entry. `/` mounts the player, `/lab.html` starts the preserved `src/lab/start-lab.ts`, and `/preview.html?scene=...` mounts the player against a controlled physical lab scene. Scene query parameters on `/` do not alter normal play.
- `src/app/player-app.ts` owns session/input/view/renderer/audio/celebration wiring, frame accumulation, preferences, independent pauses, visibility/bfcache and teardown. Initial setup holds a menu pause. Jugar starts a fresh round; normal play always uses twelve free-scene rings. Theme/sound changes do not restart physics. A model change goes through setup and Jugar. The session and physical world remain private to composition.
- `mountPlayerUI(root, prefs, handlers)` in `src/ui/player-view.ts` returns `refs`, `update(snapshot,prefs,state)`, and `dispose()`. Refs include viewport, three pump elements, motion elements and inversion/recenter actions for existing input classes. It owns Spanish setup/settings/help/restart dialogs, draft model choice and accessibility. Manual pause is distinct from menu pause. No lab controls appear in normal play.
- `PlayerRenderer(container,{model,theme,quality?})` owns Three-only visual state and exposes `render(snapshot)`, `setTheme`, `setModel`, `pulse`, `resize`, and `dispose`. The camera uses 0.7 **degrees**. The physics adapter is not passed into this renderer. Reduced rendering quality preserves physical parameters.
- `src/themes/` exports `THEMES`, `theme(id)`, `ThemeDefinition`, `ThemeId` and `MascotId`. Each frozen theme has mechanical-independent palette/UI colors and an inline SVG mascot data URI. Code-native scene motifs differ by theme. Geometry and these sources require no theme fetch after loading.
- `createAudioController({enabled,roundId,audioContextFactory?})` returns gesture-bound `activate`, `handle(event)`, `setRound`, `setEnabled`, `setPaused`, `dispose`, and `status`. Construction/muted startup never creates an audio context. Effects are synthesized locally; the empty `AUDIO_ASSET_MANIFEST` declares no fetch/preload dependency. Acoustic judgment remains pending.
- `createCelebration(host,{theme,roundId,quality?,timer?})` returns `handle`, `setRound`, `setTheme`, `setQuality`, `setPaused`, `dispose`. It uses inline SVG art and scoped CSS, ignores pointer input, and expires after four unpaused seconds. Round changes invalidate prior effects; repeated victory does not retrigger.
- `Simulation.reset` now frees/recreates its Rapier world with the same static geometry before adding the new round. This clears prior solver/contact/allocation history so identical freshly restarted stacks reproduce the initial outcome. Keep no body/world references across a restart; snapshots remain value-only.

`public/player.css` and `public/celebration.css` are separate from laboratory `public/style.css`. The static build versions all entries/styles against a shared content hash and exports `build.json`. Fonts use system fallbacks. No service worker, account or backend was introduced.
