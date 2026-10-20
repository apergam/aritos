# Module contracts after T01

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

Ring IDs are stable inside a round; consumers pair them with `roundId` because a restart intentionally reuses the local sequence. Snapshots copy and freeze poses so render code cannot retain a removed Rapier body. Victory is emitted once per round and carries the round ID for stale-event filtering. Removing one pause reason leaves all other reasons active. Restart currently clears pause reasons; T03 owns lifecycle hardening and should define/document its revised semantics before changing this contract.

## Toy models

`src/models/toy-model.ts` contains mechanics only. It exports `ToyModelId = 'single-button' | 'two-button'`, readonly `ToyModel` (`id`, `buttonCount`, `pumpSides`, `outlets`), `TOY_MODELS`, and `toyModel(id)`. The center model has one center pump and outlet; the two-button model has left/right pumps and jets. Appearance and theme fields do not enter physics configuration.

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
  constructor(elements: { button: HTMLElement; status: HTMLElement; rollValue: HTMLInputElement; pitchValue: HTMLInputElement; rollLabel: HTMLElement; pitchLabel: HTMLElement; target?: Window });
  enable(): Promise<void>; center(): void; invert(): void;
  setManual(roll: number, pitch: number): void;
  dispose(): void;
}
```

`PocMotionControls` owns the existing permission request, sensor data listener, calibration, manual sliders, and sensor timeout. It exposes gravity and a permission action to the app composition. Pointer down and non-repeating keyboard press each issue one pulse; Space issues both sides simultaneously on the two-button model.

## Rendering and UI

`src/rendering/poc-renderer.ts` exports the internal `PocRingRenderer(scene: THREE.Scene)`, which owns torus geometry, per-ring materials, stable-ID mesh creation/removal, transforms, and threaded highlighting. It consumes values only; Rapier body references do not cross this seam.

`src/lab/poc-lab.ts` exports `PocLab(viewport: HTMLElement, modelCount: number)`. Its `cameraSnapshot(): CameraSnapshot`, `updateOutlets(modelCount)`, `resize()`, `render(snapshot, simulation)`, and `dispose()` methods own the complete POC Three scene, fixed lab camera and controls, tank/pegs/jets, pump bubbles, gravity arrow, collision debug draw, renderer sizing, and graphics cleanup. It composes `PocRingRenderer` internally. `render` accepts the readonly session snapshot plus the physics adapter only for laboratory debug output and active pump effects.

`src/ui/poc-view.ts` exports `renderPocStatus(root: ParentNode, snapshot: SessionSnapshot): void`; it projects mode, progress, and escape status into the current Spanish POC readouts. `src/main.ts` remains composition: it wires reset/model/mode/pause controls, commands, session events, fixed-step timing, diagnostics export, and teardown across the session, input, lab, and UI modules.

## Platform preferences

`src/platform/preferences.ts` exports `PlayerPreferences` (`model`, `theme`, `sound`, `control`), `DEFAULT_PREFERENCES`, `PREFERENCES_KEY`, `parsePreferences(serialized, fallback?)`, and `createPreferenceStore(storage?)`. The parser validates partial/corrupt values and the adapter catches unavailable/throwing storage. It stores only durable choices; it does not serialize a round. App startup does not automatically hydrate or persist preferences in T01; T05 owns that user-facing behavior. Theme appearance selection remains a rendering/app concern until theme definitions are implemented; the session does not advertise a theme command without an appearance adapter.

## Integration extension points

- T02 can replace the POC control implementation and keep the `PocInputActions` command seam or evolve it with coordinated contract changes.
- T03 can own `GameSession` lifecycle semantics and extend `SessionCommand`/`PauseReason` for confirmation, visibility, and stale asynchronous work.
- T04 can extend the model data while keeping the physics adapter free of theme data.
- T05 can wire `createPreferenceStore` into round startup and settings without persisting a `SessionSnapshot`.
- Later rendering and UI work can subscribe to snapshots/events; they must release renderer/UI resources on teardown and check `roundId` when handling delayed events.

T01 does not change the accepted POC's four lab scenes, camera controls, diagnostics, pump strength/drag, tank depth, jets, or either game rule. Sensor permissions, mobile touch validation, mobile FPS, and device behavior remain unverified by this extraction.
