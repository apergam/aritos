import { Simulation, type GameMode, type PumpSide, type Scene, type Vec } from '../physics';
import { toyModel, type ToyModelId } from '../models/toy-model';

export type PauseReason = 'manual' | 'menu' | 'document-hidden' | 'restart-confirmation';
export type RingPose = Readonly<{ id: number; position: Vec; rotation: Readonly<{ x: number; y: number; z: number; w: number }>; threaded: boolean }>;
export type SessionSnapshot = Readonly<{
  roundId: number; scene: Scene; model: ToyModelId; mode: GameMode;
  rings: readonly RingPose[]; total: number; active: number; collected: number;
  activeSeconds: number; paused: readonly PauseReason[]; won: boolean; escaped: boolean;
}>;
export type SessionCommand =
  | { type: 'pump'; side: PumpSide }
  | { type: 'orient'; gravity: Vec }
  | { type: 'pause'; reason: PauseReason; paused: boolean }
  | { type: 'restart'; scene?: Scene };
export type GameEvent =
  | Readonly<{ type: 'pump'; roundId: number; side: PumpSide }>
  | Readonly<{ type: 'ring-collected'; roundId: number; ringId: number; collected: number; total: number }>
  | Readonly<{ type: 'victory'; roundId: number; mode: GameMode }>;
export type SessionOptions = Readonly<{ scene?: Scene; model?: ToyModelId; mode?: GameMode }>;

/** Owns round identity and rule-facing events; Rapier details stay behind Simulation. */
export class GameSession {
  readonly simulation: Simulation;
  private round = 0;
  private scene: Scene;
  private model: ToyModelId;
  private listeners = new Set<(event: GameEvent) => void>();
  private pauses = new Set<PauseReason>();
  private victoryRound = -1;
  private disposed = false;

  constructor(options: SessionOptions = {}) {
    this.scene = options.scene ?? 'free'; this.model = options.model ?? 'two-button';
    this.simulation = new Simulation();
    this.simulation.mode = options.mode ?? 'collect';
    this.simulation.model = toyModel(this.model).buttonCount;
    this.simulation.onWin = () => {
      if (this.victoryRound === this.round) return;
      this.victoryRound = this.round;
      this.emit({ type: 'victory', roundId: this.round, mode: this.simulation.mode });
    };
    this.simulation.reset(this.scene);
  }

  subscribe(listener: (event: GameEvent) => void): () => void {
    if (this.disposed) throw new Error('GameSession is disposed');
    this.listeners.add(listener); return () => this.listeners.delete(listener);
  }

  dispatch(command: SessionCommand): void {
    if (this.disposed) return;
    switch (command.type) {
      case 'pump':
        if (!this.isPaused) { this.simulation.pump(command.side); this.emit({ type: 'pump', roundId: this.round, side: command.side }); }
        break;
      case 'orient': this.simulation.setGravity(command.gravity); break;
      case 'pause': command.paused ? this.pauses.add(command.reason) : this.pauses.delete(command.reason); break;
      case 'restart': this.startRound({ scene: command.scene ?? this.scene }); break;
    }
  }

  startRound(options: SessionOptions = {}): void {
    if (this.disposed) return;
    this.round++; this.victoryRound = -1; this.pauses.clear();
    this.scene = options.scene ?? this.scene;
    this.model = options.model ?? this.model;
    if (options.mode) this.simulation.mode = options.mode;
    this.simulation.model = toyModel(this.model).buttonCount;
    this.simulation.reset(this.scene);
  }

  /** One fixed physics tick. The caller owns accumulation and frame catch-up limits. */
  step(): void {
    if (this.disposed || this.isPaused) return;
    const before = this.simulation.rings.map(r => r.id);
    const priorCollected = this.simulation.collected;
    this.simulation.step();
    if (this.simulation.collected > priorCollected) {
      const removed = new Set(before.filter(id => !this.simulation.rings.some(r => r.id === id)));
      for (const ringId of removed) this.emit({ type: 'ring-collected', roundId: this.round, ringId, collected: this.simulation.collected, total: this.simulation.totalRings });
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
  private emit(event: GameEvent): void { for (const listener of [...this.listeners]) listener(event); }
}
