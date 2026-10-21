import RAPIER from '@dimforge/rapier3d-compat';
import { DT, horizontal, RING, type Ring, type Vec } from '../../physics';
import type { GameSession } from '../../game/session';

export type RingAssistKind = 'thread' | 'above';
export type RingAssistPhase = 'approach' | 'position' | 'release';
export type RingAssistReason =
  | 'busy' | 'blocked-destination' | 'no-eligible-ring' | 'paused'
  | 'stale-round' | 'unsupported-layout' | 'won' | 'disposed';
export type RingAssistRequest = Readonly<{ accepted: boolean; reason?: RingAssistReason; ringId?: number }>;
export type RingAssistState = Readonly<{
  active: boolean;
  kind: RingAssistKind | null;
  ringId: number | null;
  position: Readonly<Vec> | null;
  phase: RingAssistPhase | null;
  progress: number;
  movement: 'scripted' | null;
}>;

type ActiveAssist = {
  kind: RingAssistKind;
  ring: Ring;
  roundId: number;
  tick: number;
  points: readonly Readonly<Vec>[];
  initialRotation: Readonly<{ x: number; y: number; z: number; w: number }>;
  initialVelocity: Readonly<Vec>;
  initialAngularVelocity: Readonly<Vec>;
};

const DURATION_TICKS = Math.round(2 / DT);
const SEGMENT_TICKS = [48, 72, 24, 96] as const;
const freezeVec = (value: Vec): Readonly<Vec> => Object.freeze({ x: value.x, y: value.y, z: value.z });
const horizontalRotation = Object.freeze({ x: horizontal.x, y: horizontal.y, z: horizontal.z, w: horizontal.w });

/** Explicit lab-only scripted placement; physics still owns contact, threading and collection. */
export class RingAssistController {
  private active: ActiveAssist | undefined;
  private disposed = false;
  private completed = 0;

  constructor(private readonly session: GameSession) {}

  get scriptedCount(): number { return this.completed; }

  get state(): RingAssistState {
    this.reconcileRound();
    const active = this.active;
    if (!active || !this.isLive(active)) return Object.freeze({ active: false, kind: null, ringId: null, position: null, phase: null, progress: 0, movement: null });
    const p = active.ring.body.translation();
    return Object.freeze({
      active: true, kind: active.kind, ringId: active.ring.id,
      position: freezeVec(p), phase: this.phaseFor(active),
      progress: Math.min(1, active.tick / DURATION_TICKS), movement: 'scripted',
    });
  }

  request(kind: RingAssistKind, roundId?: number): RingAssistRequest {
    this.reconcileRound();
    if (this.disposed) return { accepted: false, reason: 'disposed' };
    const currentRound = this.currentRoundId();
    if (currentRound === undefined) { this.disposed = true; return { accepted: false, reason: 'disposed' }; }
    if (roundId !== undefined && roundId !== currentRound) return { accepted: false, reason: 'stale-round' };
    if (this.active) return { accepted: false, reason: 'busy' };
    if (this.session.isPaused) return { accepted: false, reason: 'paused' };
    const simulation = this.session.simulation;
    if (simulation.won) return { accepted: false, reason: 'won' };
    if (simulation.layout.width !== 9 || simulation.layout.ringCount !== 12 || simulation.layout.pegLayout !== 'floor') {
      return { accepted: false, reason: 'unsupported-layout' };
    }

    const candidates = [...simulation.rings]
      .filter(ring => !simulation.isThreaded(ring) && ring.body.translation().y <= -4.6)
      .sort((a, b) => a.id - b.id);
    if (!candidates.length) return { accepted: false, reason: 'no-eligible-ring' };

    for (const ring of candidates) {
      const target = this.choosePeg(ring, kind);
      if (!target) continue;
      const p = ring.body.translation(), q = ring.body.rotation();
      const velocity = ring.body.linvel(), angular = ring.body.angvel();
      const top = Math.max(p.y + 1.2, target.peg.tipY + 1.3);
      const releaseY = kind === 'thread' ? target.peg.baseY + .2 : target.peg.tipY + .8;
      const points = Object.freeze([
        freezeVec(p),
        freezeVec({ x: p.x, y: top, z: p.z }),
        freezeVec({ x: target.peg.x, y: top, z: target.peg.z }),
        freezeVec({ x: target.peg.x, y: target.peg.tipY + .8, z: target.peg.z }),
        freezeVec({ x: target.peg.x, y: releaseY, z: target.peg.z }),
      ]);
      ring.body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true);
      ring.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      ring.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      this.active = {
        kind, ring, roundId: currentRound, tick: 0, points,
        initialRotation: Object.freeze({ x: q.x, y: q.y, z: q.z, w: q.w }),
        initialVelocity: freezeVec(velocity), initialAngularVelocity: freezeVec(angular),
      };
      this.completed++;
      return { accepted: true, ringId: ring.id };
    }
    return { accepted: false, reason: 'blocked-destination' };
  }

  /** Advance once immediately before the session's fixed physics tick. */
  beforeStep(): void {
    this.reconcileRound();
    const active = this.active;
    if (!active || this.disposed || this.session.isPaused || !this.isLive(active)) return;
    active.tick++;
    const { from, to, ratio } = this.pathSample(active);
    const next = {
      x: from.x + (to.x - from.x) * ratio,
      y: from.y + (to.y - from.y) * ratio,
      z: from.z + (to.z - from.z) * ratio,
    };
    const body = active.ring.body;
    if (active.tick >= DURATION_TICKS) {
      // Make the scripted endpoint explicit, then return ownership to Rapier dynamics.
      body.setTranslation(next, true);
      body.setRotation(horizontalRotation, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      body.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
      this.active = undefined;
      return;
    }
    body.setNextKinematicTranslation(next);
    body.setNextKinematicRotation(horizontalRotation);
  }

  cancel(): void {
    const active = this.active;
    this.active = undefined;
    if (!active || !this.isLive(active)) return;
    const body = active.ring.body;
    body.setRotation(active.initialRotation, true);
    body.setLinvel(active.initialVelocity, true);
    body.setAngvel(active.initialAngularVelocity, true);
    body.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
  }

  dispose(): void {
    if (this.disposed) return;
    this.cancel();
    this.disposed = true;
  }

  private choosePeg(ring: Ring, kind: RingAssistKind) {
    const simulation = this.session.simulation;
    for (let index = 0; index < simulation.layout.pegs.length; index++) {
      const peg = simulation.layout.pegs[index];
      const occupied = simulation.rings.some(other => other !== ring && simulation.isThreaded(other) &&
        Math.abs(other.body.translation().x - peg.x) < .35 && Math.abs(other.body.translation().z - peg.z) < .35);
      if (occupied) continue;
      const y = kind === 'thread' ? peg.baseY + .2 : peg.tipY + .8;
      const blocked = simulation.rings.some(other => {
        if (other === ring) return false;
        const p = other.body.translation();
        return Math.hypot(p.x - peg.x, p.y - y, p.z - peg.z) < 2 * (RING.radius + RING.tube);
      });
      if (blocked) continue;
      const wallClear = Math.abs(peg.x) + RING.radius + RING.tube < simulation.layout.tank.x &&
        Math.abs(y) + RING.tube < simulation.layout.tank.y &&
        Math.abs(peg.z) + RING.radius + RING.tube < simulation.layout.tank.z;
      if (!wallClear) continue;
      return { index, peg };
    }
    return undefined;
  }

  private pathSample(active: ActiveAssist) {
    let elapsed = active.tick;
    for (let segment = 0; segment < SEGMENT_TICKS.length; segment++) {
      const ticks = SEGMENT_TICKS[segment];
      if (elapsed <= ticks || segment === SEGMENT_TICKS.length - 1) {
        return { from: active.points[segment], to: active.points[segment + 1], ratio: Math.min(1, elapsed / ticks) };
      }
      elapsed -= ticks;
    }
    return { from: active.points[active.points.length - 2], to: active.points[active.points.length - 1], ratio: 1 };
  }

  private phaseFor(active: ActiveAssist): RingAssistPhase {
    if (active.tick >= DURATION_TICKS) return 'release';
    if (active.tick > SEGMENT_TICKS[0] + SEGMENT_TICKS[1]) return active.kind === 'thread' ? 'position' : 'release';
    return 'approach';
  }

  private reconcileRound(): void {
    if (!this.active) return;
    const currentRound = this.currentRoundId();
    if (currentRound === undefined) {
      this.active = undefined;
      this.disposed = true;
      return;
    }
    if (this.active.roundId !== currentRound || !this.isLive(this.active)) this.active = undefined;
  }

  private isLive(active: ActiveAssist): boolean {
    if (active.roundId !== this.currentRoundId()) return false;
    if (!this.session.simulation.rings.includes(active.ring)) return false;
    try { return active.ring.body.isValid(); } catch { return false; }
  }

  private currentRoundId(): number | undefined {
    try { return this.session.snapshot().roundId; } catch { return undefined; }
  }
}

