import { RING } from '../../physics';
import type { GameSession } from '../../game/session';
import { TOY_PHYSICS } from '../../models/toy-model';
import type { LabLayout } from './geometry';

export type VillainSpawnResult = Readonly<{
  encounterId: string;
  roundId: number;
  requested: 1 | 2;
  spawned: readonly number[];
  ok: boolean;
  reason?: 'paused' | 'won' | 'stale-round' | 'duplicate' | 'disposed' | 'unsupported-round' | 'no-safe-space';
}>;

type Request = { addCount: 1 | 2; roundId: number; encounterId: string };
export type VillainRequestResult = Readonly<{ accepted: boolean; pending: boolean; encounterId: string; roundId: number; reason?: 'duplicate' | 'stale-round' | 'disposed' | 'paused' | 'pending' }>;
/** Opt-in manual enemy behavior for the approved layouts. Call beforeStep immediately before each session.step(). */
export class VillainEncounterController {
  private pending: Request[] = [];
  private seen = new Set<string>();
  private disposed = false;
  private lastRound: number;
  private successfulEncounters = 0;
  private sequence = 0;
  private ringIds = new Set<number>();
  private currentStatus: VillainSpawnResult | undefined;

  constructor(private readonly session: GameSession) {
    this.lastRound = session.snapshot().roundId;
  }

  /** Queue one manual encounter. It is validated again at the physics boundary. */
  request(addCount: 1 | 2, roundId = this.session.snapshot().roundId, encounterId = `villain-${++this.sequence}`): VillainRequestResult {
    this.syncRound();
    const fail = (reason: VillainRequestResult['reason']): VillainRequestResult => Object.freeze({ accepted: false, pending: false, encounterId, roundId, reason });
    if (this.disposed) return fail('disposed');
    if (roundId !== this.lastRound) return fail('stale-round');
    if (this.session.snapshot().paused.length) return fail('paused');
    if (this.seen.has(`${roundId}:${encounterId}`)) return fail('duplicate');
    if (this.pending.length) return fail('pending');
    this.seen.add(`${roundId}:${encounterId}`);
    this.pending.push({ addCount, roundId, encounterId });
    return Object.freeze({ accepted: true, pending: true, encounterId, roundId });
  }

  /** Consume at most one request immediately before the parent's session.step(). */
  beforeStep(): VillainSpawnResult | undefined {
    this.syncRound();
    const request = this.pending.shift();
    if (!request) return undefined;
    const snapshot = this.session.snapshot();
    let reason: VillainSpawnResult['reason'];
    if (this.disposed) reason = 'disposed';
    else if (request.roundId !== snapshot.roundId) reason = 'stale-round';
    else if (snapshot.paused.length) reason = 'paused';
    else if (snapshot.won) reason = 'won';
    else if (this.successfulEncounters >= 1) reason = 'unsupported-round';
    else if (snapshot.scene !== 'free' || snapshot.total !== 12 || snapshot.total + request.addCount > 14 || !this.isSupportedLayout()) reason = 'unsupported-round';
    if (reason) return this.finish(request, [], reason);

    const positions = this.findSafePositions(request.addCount);
    if (!positions) return this.finish(request, [], 'no-safe-space');

    // No world step occurs between these calls: placement is atomic at this boundary.
    const ids: number[] = [];
    for (const { x, y, z } of positions) ids.push(this.session.simulation.addRing(x, y, z).id);
    this.session.simulation.stableTime = 0;
    this.successfulEncounters++;
    for (const id of ids) this.ringIds.add(id);
    return this.finish(request, ids);
  }

  get extraRingIds(): ReadonlySet<number> { this.syncRound(); return new Set(this.ringIds); }
  get status(): VillainSpawnResult | undefined { this.syncRound(); return this.currentStatus; }

  dispose(): void {
    this.disposed = true;
    this.pending = [];
    this.ringIds.clear();
    this.currentStatus = undefined;
  }

  private finish(request: Request, spawned: number[], reason?: VillainSpawnResult['reason']): VillainSpawnResult {
    const result: VillainSpawnResult = Object.freeze({ encounterId: request.encounterId, roundId: request.roundId,
      requested: request.addCount, spawned: Object.freeze([...spawned]), ok: !reason, ...(reason ? { reason } : {}) });
    this.currentStatus = result;
    return result;
  }

  private syncRound(): void {
    const round = this.session.snapshot().roundId;
    if (round === this.lastRound) return;
    this.lastRound = round;
    this.pending = [];
    this.seen.clear();
    this.ringIds.clear();
    this.successfulEncounters = 0;
    this.currentStatus = undefined;
  }

  private get layout(): LabLayout { return this.session.simulation.layout; }

  private isSupportedLayout(): boolean {
    const { width, ringCount, pegLayout, pegs } = this.layout;
    const approved = (width === 9 && pegLayout === 'floor') || (width === 8 && pegLayout === 'raised');
    return approved && ringCount === 12 && pegs.length === 2;
  }

  private findSafePositions(count: number): { x: number; y: number; z: number }[] | undefined {
    const radius = RING.radius + RING.tube;
    const layout = this.layout;
    // Side lanes and the center line keep the full ring envelope outside each
    // peg's vertical catchment. Placing just above the tallest peg tip also
    // clears the selected layout's high fourth row; the fall path is checked.
    const side = layout.tank.x - radius - .1;
    const spawnY = Math.max(...layout.pegs.map(peg => peg.tipY)) + .35;
    const z = Math.min(.1, layout.tank.z - radius - .1);
    const candidates = [-side, 0, side].map(x => ({ x, y: spawnY, z }));
    const accepted: typeof candidates = [];
    for (const candidate of candidates) {
      if (!this.clearOfTank(candidate, radius, layout) || !this.clearOfFixtures(candidate, radius, layout) || !this.safeFallLane(candidate, radius, layout)) continue;
      if (this.session.simulation.rings.some(r => {
        const p = r.body.translation(); return this.distance(candidate, p) < radius * 2;
      })) continue;
      if (accepted.some(other => this.distance(candidate, other) < radius * 2)) continue;
      accepted.push(candidate);
      if (accepted.length === count) return accepted;
    }
    return undefined;
  }

  private clearOfTank(p: { x: number; y: number; z: number }, r: number, layout: LabLayout): boolean {
    const margin = .1;
    return Math.abs(p.x) + r + margin <= layout.tank.x && Math.abs(p.z) + r + margin <= layout.tank.z && Math.abs(p.y) + r + margin <= layout.tank.y;
  }

  private clearOfFixtures(p: { x: number; y: number; z: number }, r: number, layout: LabLayout): boolean {
    const margin = .1;
    for (const peg of layout.pegs) {
      const dx = p.x - peg.x, dz = p.z - peg.z;
      const nearestY = Math.max(peg.baseY, Math.min(peg.tipY, p.y));
      if (Math.hypot(dx, p.y - nearestY, dz) < r + TOY_PHYSICS.pegRadius + margin) return false;
      const base = { x: peg.x, y: peg.baseY - TOY_PHYSICS.base.footHeight / 2, z: peg.z };
      if (this.sphereIntersectsBox(p, r, base, { x: TOY_PHYSICS.base.halfWidth, y: TOY_PHYSICS.base.footHeight / 2, z: TOY_PHYSICS.base.halfDepth }, margin)) return false;
    }
    for (const support of layout.supports) if (this.sphereIntersectsBox(p, r, support.center, support.halfExtents, margin)) return false;
    return true;
  }

  private safeFallLane(p: { x: number; y: number; z: number }, radius: number, layout: LabLayout): boolean {
    const gravity = this.session.simulation.gravity;
    if (gravity.y >= -.05) return false;
    const endY = -layout.tank.y + radius + .1;
    if (endY >= p.y) return false;
    const atHeight = (y: number) => {
      const time = (y - p.y) / gravity.y;
      return { x: p.x + gravity.x * time, z: p.z + gravity.z * time };
    };
    const end = atHeight(endY);
    const margin = .1;
    // A straight trajectory that crosses a wall can bounce back into a peg.
    // Since tank bounds are convex, checking both endpoints proves the full
    // swept ring envelope stays inside them.
    if (Math.abs(end.x) + radius + margin > layout.tank.x || Math.abs(end.z) + radius + margin > layout.tank.z) return false;

    // Avoid bases and raised supports along the entire fall, not just at the
    // spawn point. A collision there can redirect a tilted fall toward a peg.
    for (const peg of layout.pegs) {
      const base = { x: peg.x, y: peg.baseY - TOY_PHYSICS.base.footHeight / 2, z: peg.z };
      if (this.sweptSphereIntersectsBox(p, endY, end, radius, base,
        { x: TOY_PHYSICS.base.halfWidth, y: TOY_PHYSICS.base.footHeight / 2, z: TOY_PHYSICS.base.halfDepth }, margin)) return false;
    }
    for (const support of layout.supports) {
      if (this.sweptSphereIntersectsBox(p, endY, end, radius, support.center, support.halfExtents, margin)) return false;
    }

    const clearance = radius + TOY_PHYSICS.pegRadius + margin;
    for (const peg of layout.pegs) {
      const low = Math.max(endY, peg.baseY - clearance), high = Math.min(p.y, peg.tipY + clearance);
      if (low > high) continue;
      const a = atHeight(low), b = atHeight(high), dx = b.x - a.x, dz = b.z - a.z;
      const lengthSquared = dx * dx + dz * dz;
      const t = lengthSquared > 0 ? Math.max(0, Math.min(1, ((peg.x - a.x) * dx + (peg.z - a.z) * dz) / lengthSquared)) : 0;
      if (Math.hypot(a.x + t * dx - peg.x, a.z + t * dz - peg.z) < clearance) return false;
    }
    return true;
  }

  private sphereIntersectsBox(
    p: { x: number; y: number; z: number }, radius: number,
    center: { x: number; y: number; z: number }, half: { x: number; y: number; z: number }, margin: number,
  ): boolean {
    const dx = Math.max(0, Math.abs(p.x - center.x) - half.x);
    const dy = Math.max(0, Math.abs(p.y - center.y) - half.y);
    const dz = Math.max(0, Math.abs(p.z - center.z) - half.z);
    return Math.hypot(dx, dy, dz) < radius + margin;
  }

  private sweptSphereIntersectsBox(
    start: { x: number; y: number; z: number }, endY: number, end: { x: number; z: number }, radius: number,
    center: { x: number; y: number; z: number }, half: { x: number; y: number; z: number }, margin: number,
  ): boolean {
    const pathMin = { x: Math.min(start.x, end.x), y: endY, z: Math.min(start.z, end.z) };
    const pathMax = { x: Math.max(start.x, end.x), y: start.y, z: Math.max(start.z, end.z) };
    const boxMin = { x: center.x - half.x - radius - margin, y: center.y - half.y - radius - margin, z: center.z - half.z - radius - margin };
    const boxMax = { x: center.x + half.x + radius + margin, y: center.y + half.y + radius + margin, z: center.z + half.z + radius + margin };
    return pathMin.x <= boxMax.x && pathMax.x >= boxMin.x
      && pathMin.y <= boxMax.y && pathMax.y >= boxMin.y
      && pathMin.z <= boxMax.z && pathMax.z >= boxMin.z;
  }

  private distance(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number {
    return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  }
}

