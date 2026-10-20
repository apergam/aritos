import { BASE, PEGS, RING, TANK, TIP } from '../../physics';
import type { GameSession } from '../../game/session';

export type VillainSpawnResult = Readonly<{
  encounterId: string;
  roundId: number;
  requested: 1 | 2;
  spawned: readonly number[];
  ok: boolean;
  reason?: 'paused' | 'won' | 'stale-round' | 'duplicate' | 'disposed' | 'unsupported-round' | 'no-safe-space';
}>;

type Request = { addCount: 1 | 2; roundId: number; encounterId: string };
export type VillainRequestResult = Readonly<{ accepted: boolean; pending: boolean; encounterId: string; roundId: number; reason?: 'duplicate' | 'stale-round' | 'disposed' }>;

/** Opt-in laboratory-only enemy behavior. Call beforeStep immediately before each session.step(). */
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
    if (this.seen.has(`${roundId}:${encounterId}`)) return fail('duplicate');
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
    else if (snapshot.scene !== 'free' || snapshot.model !== 'two-button' || snapshot.total !== 12 || snapshot.total + request.addCount > 14) reason = 'unsupported-round';
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

  get extraRingIds(): ReadonlySet<number> { return new Set(this.ringIds); }
  get status(): VillainSpawnResult | undefined { return this.currentStatus; }

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

  private findSafePositions(count: number): { x: number; y: number; z: number }[] | undefined {
    const radius = RING.radius + RING.tube;
    // The full ring's bounding sphere is deliberately used as clearance. The upper
    // grid stays clear of the peg tips, bases, walls, and starting stacks.
    const candidates = [-3.55, -1.75, 0, 1.75, 3.55].map(x => ({ x, y: 4.75, z: 0 }));
    const accepted: typeof candidates = [];
    for (const candidate of candidates) {
      if (!this.clearOfTank(candidate, radius) || !this.clearOfFixtures(candidate, radius)) continue;
      if (this.session.simulation.rings.some(r => {
        const p = r.body.translation(); return this.distance(candidate, p) < radius * 2;
      })) continue;
      if (accepted.some(other => this.distance(candidate, other) < radius * 2)) continue;
      accepted.push(candidate);
      if (accepted.length === count) return accepted;
    }
    return undefined;
  }

  private clearOfTank(p: { x: number; y: number; z: number }, r: number): boolean {
    return Math.abs(p.x) + r <= TANK.x && Math.abs(p.z) + r <= TANK.z && Math.abs(p.y) + r <= TANK.y;
  }

  private clearOfFixtures(p: { x: number; y: number; z: number }, r: number): boolean {
    for (const peg of PEGS) {
      const dx = p.x - peg.x, dz = p.z - peg.z;
      const nearestY = Math.max(BASE, Math.min(TIP, p.y));
      if (Math.hypot(dx, p.y - nearestY, dz) < r + .12) return false;
      // Base is a low, wide cylinder; check its horizontal footprint when vertically close.
      if (Math.abs(p.y - (BASE - .15)) < r + .15 && Math.hypot(dx, dz) < r + .86) return false;
    }
    return true;
  }

  private distance(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number {
    return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  }
}

