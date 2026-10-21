import type { GameSession } from '../session';
import { RingAssistController, type RingAssistKind } from '../../lab/experiments/assist';
import { VillainEncounterController } from '../../lab/experiments/enemies';
import { VillainCue } from '../../lab/experiments/villain-cue';

export type MascotState = Readonly<{
 busy: boolean; enemyUsed: boolean; message: string;
 actor: Readonly<{ villain: boolean; caption: string; position: Readonly<{x:number;y:number;z:number}> }> | null;
}>;
type Cue = Pick<VillainCue, 'unlock'|'play'|'stop'|'dispose'>;

/** Coordinates the accepted manual helpers and challenge, using active simulation time. */
export class PlayerMascots {
 private helper: RingAssistController;
 private enemy: VillainEncounterController;
 private readonly cue: Cue;
 private pending = false;
 private enemyUntil = 0;
 private enemyPosition = {x:0,y:4.5,z:0};
 private message = 'Una mano amiga o una travesura: tú eliges.';
 private audioEnabled = false;
 private disposed = false;
 private roundId: number;
 constructor(private readonly session: GameSession, private readonly duck: (active:boolean)=>void, cue?: Cue) {
  this.helper = new RingAssistController(session); this.enemy = new VillainEncounterController(session);
  this.cue = cue ?? new VillainCue(); this.roundId = session.snapshot().roundId;
 }
 get extraRingIds(): ReadonlySet<number> { return this.enemy.extraRingIds; }
 get state(): MascotState {
  this.reconcile();
  const assist = this.helper.state;
  const villain = this.session.snapshot().activeSeconds < this.enemyUntil;
  const actor = assist.active && assist.position ? {villain:false,caption:assist.kind==='thread'?'¡Te echo una mano!':'¡Ahora te toca!',position:assist.position}
   : villain ? {villain:true,caption:'¡A ver con estos!',position:this.enemyPosition} : null;
  return {busy:assist.active || villain || this.pending, enemyUsed:this.extraRingIds.size>0, message:this.message, actor};
 }
 requestAssist(kind: RingAssistKind): boolean {
  if (this.disposed || this.state.busy) return false;
  const result = this.helper.request(kind);
  this.message = result.accepted ? (kind==='thread'?'La mascota lleva un aro hasta la base.':'La mascota suelta un aro sobre la estaca.')
   : result.reason==='no-eligible-ring' ? 'Espera a que un aro libre llegue al suelo.'
   : result.reason==='blocked-destination' ? 'La estaca está ocupada. Prueba a soltarlo arriba.'
   : result.reason==='paused' ? 'Continúa la partida para pedir ayuda.' : 'No hay una ayuda disponible en este momento.';
  return result.accepted;
 }
 requestVillain(count: 1|2): boolean {
  if (this.disposed || this.state.busy || this.state.enemyUsed) return false;
  const result = this.enemy.request(count);
  if (result.accepted) {
   this.pending = true; this.message = 'La traviesa busca un lugar para sus aros…';
   if (this.audioEnabled) void this.cue.unlock();
  }
  return result.accepted;
 }
 /** Must run before every fixed physics tick. Safe to call when paused to reject queued actions. */
 beforeStep(): void {
  if (this.disposed) return;
  this.reconcile();
  this.helper.beforeStep();
  const result = this.enemy.beforeStep();
  if (!result) return;
  this.pending = false;
  if (!result.ok) {
   this.message = result.reason==='no-safe-space' ? 'No hay una caída segura. Centra el juguete, despeja la parte alta y prueba otra vez.'
    : result.reason==='paused' ? 'La travesura se canceló al pausar.' : 'La traviesa ya no puede entrar en esta ronda.';
   return;
  }
  const ring = this.session.simulation.rings.find(r=>r.id===result.spawned[0]);
  if (ring) this.enemyPosition = {...ring.body.translation()};
  this.enemyUntil = this.session.snapshot().activeSeconds + 2.2;
  this.message = `¡La traviesa añadió ${result.spawned.length===1?'un aro':'dos aros'}!`;
  if (this.audioEnabled) { this.duck(true); void this.cue.play(); }
 }
 update(): void {
  if (this.disposed) return;
  this.reconcile();
  if (this.session.isPaused || !this.audioEnabled || this.session.snapshot().activeSeconds>=this.enemyUntil) this.stopCue();
 }
 setAudioEnabled(enabled: boolean): void { this.audioEnabled=enabled; if(!enabled)this.stopCue(); }
 setPaused(paused: boolean): void { if(paused){this.stopCue();this.beforeStep();} }
 /** Restore a carried body's dynamics before the world is reset. */
 reset(): void {
  this.helper.dispose(); this.enemy.dispose(); this.stopCue(); this.pending=false; this.enemyUntil=0;
  if(this.disposed)return;
  this.helper=new RingAssistController(this.session); this.enemy=new VillainEncounterController(this.session);
  this.roundId=this.session.snapshot().roundId;
  this.message='Una mano amiga o una travesura: tú eliges.';
 }
 dispose(): void { if(this.disposed)return;this.disposed=true;this.helper.dispose();this.enemy.dispose();this.stopCue();this.cue.dispose(); }
 private stopCue(): void { this.cue.stop(); this.duck(false); }
 private reconcile(): void { if(!this.disposed && this.roundId!==this.session.snapshot().roundId)this.reset(); }
}
