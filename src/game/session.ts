import { Simulation, type GameMode, type PumpSide, type Scene, type Vec } from '../physics';
import { toyModel, type ToyModelId } from '../models/toy-model';
import type { LabSimulationSettings } from '../lab/experiments/geometry';

export type PauseReason = 'manual' | 'menu' | 'document-hidden' | 'restart-confirmation' | 'decoration';
export type RingPose = Readonly<{ id: number; position: Vec; rotation: Readonly<{ x: number; y: number; z: number; w: number }>; threaded: boolean }>;
export type SessionSnapshot = Readonly<{
  roundId: number; scene: Scene; model: ToyModelId; mode: GameMode;
  rings: readonly RingPose[]; total: number; active: number; collected: number;
  activeSeconds: number; paused: readonly PauseReason[]; won: boolean; escaped: boolean;
}>;
export type SessionCommand =
  | { type: 'pump'; side: PumpSide; intensity?: number }
  | { type: 'orient'; gravity: Vec }
  | { type: 'pause'; reason: PauseReason; paused: boolean }
  | { type: 'start'; options?: SessionOptions }
  | { type: 'set-model'; model: ToyModelId; scene?: Scene }
  | { type: 'set-mode'; mode: GameMode; scene?: Scene }
  | { type: 'restart'; scene?: Scene };
export type GameEvent =
  | Readonly<{ type: 'pump'; roundId: number; side: PumpSide; intensity?: number }>
  | Readonly<{ type: 'ring-collected'; roundId: number; ringId: number; collected: number; total: number }>
  | Readonly<{ type: 'victory'; roundId: number; mode: GameMode }>;
export type SessionOptions = Readonly<{ scene?: Scene; model?: ToyModelId; mode?: GameMode; lab?: LabSimulationSettings }>;

/** Owns round identity and rule-facing events; Rapier details stay behind Simulation. */
export class GameSession {
  readonly simulation: Simulation;
  private round = 0;
  private scene: Scene;
  private model: ToyModelId;
  private labSettings: LabSimulationSettings = {};
  private listeners = new Set<(event: GameEvent) => void>();
  private pauses = new Set<PauseReason>();
  private victoryRound = -1;
  private steppingRound: number | undefined;
  private pendingVictory: Extract<GameEvent, { type: 'victory' }> | undefined;
  private disposed = false;

  constructor(options: SessionOptions = {}) {
    this.scene = options.scene ?? 'free'; this.model = options.model ?? 'two-button';
    this.labSettings = options.lab ?? {};
    this.simulation = new Simulation(this.labSettings);
    this.simulation.mode = options.mode ?? 'collect';
    this.simulation.model = toyModel(this.model).buttonCount;
    this.simulation.onWin = () => {
      const roundId = this.steppingRound;
      if (roundId === undefined) return;
      if (roundId !== this.round) return;
      const mode = this.simulation.mode;
      if (this.victoryRound === roundId) return;
      this.victoryRound = roundId;
      this.pendingVictory = { type: 'victory', roundId, mode };
    };
    this.simulation.reset(this.scene, this.labSettings);
  }

  subscribe(listener: (event: GameEvent) => void): () => void {
    if (this.disposed) throw new Error('GameSession is disposed');
    this.listeners.add(listener); return () => this.listeners.delete(listener);
  }

  dispatch(command: SessionCommand): void {
    if (this.disposed) return;
    switch (command.type) {
      case 'pump':
        if (!this.isPaused && toyModel(this.model).pumpSides.includes(command.side)) {
          const roundId = this.round;
          const intensity = command.intensity ?? 1;
          if (!Number.isFinite(intensity)) break;
          const bounded = Math.max(.5, Math.min(1.5, intensity));
          this.simulation.pump(command.side, bounded);
          this.emit({ type: 'pump', roundId, side: command.side, intensity: bounded });
        }
        break;
      case 'orient': this.simulation.setGravity(command.gravity); break;
      case 'pause': command.paused ? this.pauses.add(command.reason) : this.pauses.delete(command.reason); break;
      case 'start': this.startRound(command.options); break;
      case 'set-model': this.startRound({ model: command.model, scene: command.scene ?? this.scene }); break;
      case 'set-mode': this.startRound({ mode: command.mode, scene: command.scene ?? this.scene }); break;
      case 'restart': this.startRound({ scene: command.scene ?? this.scene }); break;
    }
  }

  startRound(options: SessionOptions = {}): void {
    if (this.disposed) return;
    this.round++; this.victoryRound = -1;
    this.pendingVictory = undefined;
    // A completed/canceled settings flow closes with the new round. Manual pause
    // and browser visibility remain independent and continue to hold simulation.
    this.pauses.delete('menu');
    this.pauses.delete('restart-confirmation');
    this.scene = options.scene ?? this.scene;
    this.model = options.model ?? this.model;
    if (options.mode) this.simulation.mode = options.mode;
    if (options.lab) this.labSettings = Object.freeze({ ...options.lab });
    this.simulation.model = toyModel(this.model).buttonCount;
    this.simulation.reset(this.scene, this.labSettings);
  }

  /** One fixed physics tick. The caller owns accumulation and frame catch-up limits. */
  step(): void {
    if (this.disposed || this.isPaused) return;
    const roundId = this.round;
    const before = this.simulation.rings.map(r => r.id);
    const priorCollected = this.simulation.collected;
    this.pendingVictory = undefined;
    this.steppingRound = roundId;
    try { this.simulation.step(); }
    finally { this.steppingRound = undefined; }
    // A victory subscriber may synchronously start another round during step().
    // Never interpret that new round's state as events from the old one.
    if (this.disposed || roundId !== this.round) return;
    if (this.simulation.collected > priorCollected) {
      const removed = new Set(before.filter(id => !this.simulation.rings.some(r => r.id === id)));
      for (const ringId of removed) {
        if (this.disposed || roundId !== this.round) return;
        this.emit({ type: 'ring-collected', roundId, ringId, collected: this.simulation.collected, total: this.simulation.totalRings });
      }
    }
    const pendingVictory = this.pendingVictory as Extract<GameEvent, { type: 'victory' }> | undefined;
    if (!this.disposed && roundId === this.round && pendingVictory?.roundId === roundId) {
      const victory = pendingVictory;
      this.pendingVictory = undefined;
      this.emit(victory);
    }
  }

  snapshot(): SessionSnapshot {
    const s = this.simulation;
    const rings = s.rings.map(r => {
      const p = r.body.translation(), q = r.body.rotation();
      return Object.freeze({ id: r.id, position: Object.freeze({ x: p.x, y: p.y, z: p.z }), rotation: Object.freeze({ x: q.x, y: q.y, z: q.z, w: q.w }), threaded: s.isThreaded(r) });
    });
    return Object.freeze({ roundId: this.round, scene: this.scene, model: this.model, mode: s.mode,
      rings: Object.freeze(rings), total: s.totalRings, active: s.rings.length, collected: s.collected,
      activeSeconds: s.time, paused: Object.freeze([...this.pauses]), won: s.won, escaped: s.escaped });
  }

  get isPaused(): boolean { return this.pauses.size > 0; }
  get pauseReasons(): readonly PauseReason[] { return Object.freeze([...this.pauses]); }
  dispose(): void { if (this.disposed) return; this.disposed = true; this.listeners.clear(); this.pauses.clear(); this.simulation.onWin = undefined; this.simulation.dispose(); }
  private emit(event: GameEvent): void {
    for (const listener of [...this.listeners]) {
      if (this.disposed || event.roundId !== this.round) return;
      listener(event);
    }
  }
}
