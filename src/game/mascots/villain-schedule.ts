import type { SessionSnapshot } from '../session';

/** Remaining challenge, including classic rings that are still unthreaded. */
export function remainingRings(snapshot: SessionSnapshot): number {
 return snapshot.mode === 'collect' ? snapshot.active : snapshot.total-snapshot.rings.filter(ring=>ring.threaded).length;
}

/** One randomized wait in the 1–5 range; uses active physics time, never wall/frame time. */
export class VillainSchedule {
 private roundId?: number;
 private dueAt?: number;
 private triggerRemaining?: number;
 constructor(private readonly random: ()=>number = Math.random) {}
 ready(snapshot: SessionSnapshot, busy: boolean, used: boolean): boolean {
  if (this.roundId!==snapshot.roundId) {this.reset();this.roundId=snapshot.roundId;}
  const remaining=remainingRings(snapshot);
  if (snapshot.won || used || snapshot.scene!=='free' || remaining<1 || remaining>5) {this.dueAt=undefined;return false;}
  if (snapshot.paused.length || busy) return false;
  this.triggerRemaining ??= 1+Math.min(4,Math.floor(this.sample()*5));
  if(remaining>this.triggerRemaining){this.dueAt=undefined;return false;}
  if (this.dueAt===undefined) this.dueAt=snapshot.activeSeconds+1+2*this.sample();
  return snapshot.activeSeconds>=this.dueAt;
 }
 defer(activeSeconds: number): void {this.dueAt=activeSeconds+1;}
 private sample(): number {const sample=this.random();return Number.isFinite(sample)?Math.max(0,Math.min(1,sample)):.5;}
 reset(): void {this.roundId=undefined;this.dueAt=undefined;this.triggerRemaining=undefined;}
}
