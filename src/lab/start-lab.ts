import { initPhysics, DT, TANK, RING, JETS, PULSE_DURATION, type Scene, type GameMode, type PumpSide } from '../physics';
import { GameSession, type SessionOptions } from '../game/session';
import { PocControls, PocMotionControls } from '../input/poc-controls';
import { toyModel, type ToyModelId } from '../models/toy-model';
import { createPreferenceStore, type PlayerPreferences } from '../platform/preferences';
import { PocLab } from '../lab/poc-lab';
import { EXPERIMENTS, experimentId, type ExperimentId } from './experiments/catalog';
import { PressureGestureController, type PressureMode, type PressureLevel, type PressurePulse } from './experiments/pressure';
import { bindPressureInput } from './experiments/pressure-input';
import { VillainEncounterController } from './experiments/enemies';
import { RingAssistController, type RingAssistKind } from './experiments/assist';
import { VillainCue } from './experiments/villain-cue';
import { createMusicController } from '../audio/theme-music';
import type { ThemeId } from '../themes';
import { renderPocStatus } from '../ui/poc-view';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const viewport = $('viewport');

/** Preserved POC laboratory, loaded only from the explicit lab entry. */
export async function startLab() {
 await initPhysics();
 const store = createPreferenceStore();
 let preferences = store.load();
 const savePreferences = (changes: Partial<PlayerPreferences>) => {
  preferences = { ...preferences, ...changes };
  store.save(preferences);
 };
 const session = new GameSession({ mode: 'collect', model: preferences.model }), sim = session.simulation;
 const lab = new PocLab(viewport, preferences.model);
 const pressure = new PressureGestureController();
 const enemies = new VillainEncounterController(session);
 const assist = new RingAssistController(session);
 let lastAssistActive=false, lastAssistKind:RingAssistKind|null=null;
 const music = createMusicController({ enabled:false, theme:preferences.theme });
 const villainCue = new VillainCue();
 let experiment:ExperimentId='baseline', themeId:ThemeId=preferences.theme;
 let villainUntil=0, lastPump:PressurePulse|undefined;
 const audioEnabled=()=> $<HTMLInputElement>('lab-audio').checked && preferences.sound && preferences.music;
 const activateAudio=()=>{ if(audioEnabled()){void music.activate();void villainCue.unlock();} };
 let pressureInput:ReturnType<typeof bindPressureInput>|undefined;
 $<HTMLSelectElement>('lab-theme').value=themeId; lab.setTheme(themeId);
 let activeScene: Scene = 'free', activeModel = preferences.model;
 let accumulator = 0, last = performance.now(), frameCount = 0, fpsStart = last;
 let renderFps = 0, maxPhysicsMs = 0, frameTimes: number[] = [], stepSamples: number[] = [];
 let lastCollected = 0, animationFrame = 0, disposed = false;
 let collectionFeedbackTimer: ReturnType<typeof setTimeout> | undefined, winTimer: ReturnType<typeof setTimeout> | undefined;
 const pumpTimers = new Map<PumpSide, ReturnType<typeof setTimeout>>();
 const downloadUrls = new Set<string>();
 const cleanup: Array<() => void> = [];
 const listen = (target: EventTarget, type: string, handler: EventListener) => {
  target.addEventListener(type, handler); cleanup.push(() => target.removeEventListener(type, handler));
 };
 const revealToy=()=>{if(innerWidth<=980)viewport.closest('.lab')?.scrollIntoView({behavior:'smooth',block:'start'});};
 listen($('experiment-view'),'click',()=>viewport.closest('.lab')?.scrollIntoView({behavior:'smooth',block:'start'}));
 function resetClock() { accumulator = 0; last = performance.now(); }
 function syncPauseView() {
  const manual = session.pauseReasons.includes('manual');
  $('pause').textContent = manual ? '▶ Continuar' : 'Ⅱ Pausar';
  $('paused-label').hidden = !session.isPaused;
  $('status').textContent = session.isPaused ? 'Simulación en pausa' : 'Simulación en marcha';
  pressureInput?.syncPaused(); music.setPaused(session.isPaused);
  if(session.isPaused){const canceled=enemies.beforeStep();if(canceled)$('arcade-status').textContent='La aparición pendiente se canceló al pausar.';villainCue.stop();music.setDucked(false);}else activateAudio();
 }
 function pause() {
  session.dispatch({ type: 'pause', reason: 'manual', paused: !session.pauseReasons.includes('manual') });
  resetClock(); syncPauseView();
 }
 const motion = new PocMotionControls({
  button: $('sensor'), status: $('sensor-status'), rollValue: $<HTMLInputElement>('roll'), pitchValue: $<HTMLInputElement>('pitch'),
  rollLabel: $('roll-value'), pitchLabel: $('pitch-value'),
  onGravity: () => {
   if (motion.sensorMode && preferences.control !== 'motion') savePreferences({ control: 'motion' });
  },
 });
 const targetGravity = motion.gravity, smoothGravity = targetGravity.clone();
 function manualTilt(roll: number, pitch: number) {
  motion.setManual(roll, pitch);
  if (preferences.control !== 'manual') savePreferences({ control: 'manual' });
 }
 const controls = new PocControls({
  model: () => activeModel, paused: () => session.isPaused || document.hidden,
  pump: side => pump({side,intensity:pressure.mode==='fixed'?1:pressure.level,durationSeconds:.24,source:pressure.mode==='fixed'?'fixed':'level'}),
  togglePause: pause, setManualTilt: manualTilt,
 }, {});
 function pump(pulse:PressurePulse){
  if(document.hidden||session.isPaused)return;
  lastPump=pulse;$('lab-pump-readout').hidden=false;$('lab-pump-readout').textContent=`FUERZA ${(sim.strength*pulse.intensity).toFixed(1)} · 0.24 S`;activateAudio();session.dispatch({type:'pump',side:pulse.side,intensity:pulse.intensity});
  $('pressure-readout').textContent=`${({left:'Izquierda',right:'Derecha',center:'Centro'})[pulse.side]}: fuerza ${(sim.strength*pulse.intensity).toFixed(1)} · ${pulse.durationSeconds.toFixed(2)} s · ${pulse.source==='hardware'?'presión variable detectada':pulse.source==='charge'?'duración al soltar':'nivel explícito'}`;
 }
 pressureInput=bindPressureInput({left:$('pump-left'),right:$('pump-right'),center:$('pump-center')},pressure,{paused:()=>session.isPaused||document.hidden,pulse:pump,status:message=>{$('pressure-readout').textContent=message;}});
 function center() { motion.center(); controls.resetTilt(0, 0, false); }
 listen($('upright'), 'click', center);
 listen($('invert'), 'click', () => { manualTilt(180, 0); controls.resetTilt(180, 0, false); });
 for (const name of ['roll', 'pitch'] as const) listen($(name), 'input', () => {
  const roll = Number($<HTMLInputElement>('roll').value), pitch = Number($<HTMLInputElement>('pitch').value);
  manualTilt(roll, pitch); controls.syncTilt(roll, pitch);
 });
 function syncRoundView() {
  const snapshot = session.snapshot(); activeScene = snapshot.scene; activeModel = snapshot.model;
  const model = toyModel(activeModel); lab.setLayout(sim.layout); lab.updateOutlets(activeModel);
  const settings=sim.layout;
  $('experiment-description').textContent=EXPERIMENTS[experiment].description;
  $('experiment-dimensions').textContent=`Ancho ${settings.width} · fondo 1.8 · ${settings.ringCount} aros en Juego libre · bases ${settings.pegs.map(p=>p.baseY.toFixed(1)).join(' / ')}`;
  $('pressure-options').hidden=experiment!=='pressure';$('assist-options').hidden=experiment!=='assist';$('enemy-options').hidden=experiment!=='enemy';
  for(const id of ['strength','drag']) $<HTMLInputElement>(id).disabled=experiment!=='baseline';
  for(const id of ['enemy-one','enemy-two']) $<HTMLButtonElement>(id).disabled=experiment!=='enemy'||snapshot.scene!=='free'||snapshot.won||session.isPaused;

  $<HTMLSelectElement>('model').value = String(model.buttonCount);
  $<HTMLSelectElement>('game-mode').value = snapshot.mode;
  for (const side of ['left', 'right', 'center'] as const) $('pump-' + side).hidden = !model.pumpSides.includes(side);
  $('count-label').textContent = snapshot.mode === 'collect' ? 'GUARDADOS' : 'ENSARTADOS';
  $('count').textContent = '0 / ' + snapshot.total;
  const freeHint=document.querySelector<HTMLElement>('[data-scene="free"] small');if(freeHint)freeHint.textContent=`${settings.ringCount} aros · 2 estacas`;
  $('mode-hint').textContent = snapshot.mode === 'collect'
   ? 'Al llegar a la base, el aro se guarda y tu progreso queda acumulado.'
   : 'Mantén todos los aros ensartados durante dos segundos. Pueden volver a salir.';
  const labels = { free: '01 / JUEGO LIBRE', drop: '02 / CAÍDA Y CHOQUE', stack: '03 / APILAR Y EXTRAER', depth: '04 / PROFUNDIDAD' };
  const choice=$<HTMLSelectElement>('experiment');
  $('scene-label').textContent = labels[activeScene]+' · '+choice.options[choice.selectedIndex].text;
 document.querySelectorAll<HTMLButtonElement>('[data-scene]').forEach(b => b.classList.toggle('active', b.dataset.scene === activeScene));
  syncPauseView();
 }
 function reset(options: SessionOptions = {}) {
  assist.cancel(); lastAssistActive=false; lastAssistKind=null; pressureInput?.clear(); villainCue.stop(); music.setDucked(false); villainUntil=0;
  session.dispatch({ type: 'start', options });
  $('arcade-status').textContent=''; $('lab-mascot').hidden=true; $('lab-pump-readout').hidden=true;
  center(); smoothGravity.copy(targetGravity); resetClock();
  clearTimeout(winTimer); clearTimeout(collectionFeedbackTimer);
  for (const [side, timer] of pumpTimers) { clearTimeout(timer); $('pump-' + side).classList.remove('pressed'); }
  pumpTimers.clear(); lastCollected = 0;
  $('win').hidden = true; $('collected-feedback').hidden = true;
  syncRoundView();
 }
  listen($('experiment'),'change',()=>{
  experiment=experimentId($<HTMLSelectElement>('experiment').value);
  sim.strength=75;sim.drag=.5;$<HTMLInputElement>('strength').value='75';$('strength-value').textContent='75';$<HTMLInputElement>('drag').value='.5';$('drag-value').textContent='0.50';
  pressure.setMode(experiment==='pressure'?$<HTMLSelectElement>('pressure-mode').value as PressureMode:'fixed');
  reset({scene:'free',lab:EXPERIMENTS[experiment].settings}); revealToy();
 });
 listen($('pressure-mode'),'change',()=>{pressureInput?.clear();pressure.setMode($<HTMLSelectElement>('pressure-mode').value as PressureMode);$('pressure-readout').textContent='Nuevo modo listo. Un impulso por pulsación.';});
 listen($('pressure-level'),'change',()=>pressure.setLevel(Number($<HTMLSelectElement>('pressure-level').value) as PressureLevel));
 listen($('lab-theme'),'change',()=>{themeId=$<HTMLSelectElement>('lab-theme').value as ThemeId;lab.setTheme(themeId);music.setTheme(themeId);});
 listen($('lab-audio'),'change',()=>{music.setEnabled(audioEnabled());if(!audioEnabled()){villainCue.stop();music.setDucked(false);}else activateAudio();});
 const villainReasons:Record<string,string>={paused:'Reanuda antes de llamar al travieso.',won:'La ronda ya terminó.',duplicate:'Esa aparición ya fue procesada.',pending:'Ya hay una aparición pendiente.','unsupported-round':'Usa Juego libre: una aparición por ronda y máximo 14 aros.','no-safe-space':'No hay espacio libre para añadir esos aros.','stale-round':'La ronda cambió.',disposed:'Prueba cerrada.'};
 listen($('assist-prepare'),'click',()=>{if(experiment==='assist'){reset({scene:'drop',mode:'collect'});revealToy();}});
 const assistReasons:Record<string,string>={busy:'La mascota ya está ayudando.',paused:'Reanuda antes de pedir ayuda.',won:'La ronda ya terminó.','blocked-destination':'Las estacas están ocupadas o la llegada está bloqueada. Mueve los aros e intenta otra vez.','no-eligible-ring':'Espera a que haya un aro libre en el piso.','unsupported-layout':'Usa la prueba de ayuda con geometría original.','stale-round':'La ronda cambió.',disposed:'Prueba cerrada.'};
 for(const [id,kind]of [['assist-thread','thread'],['assist-above','above']]as const)listen($(id),'click',()=>{
  if(experiment!=='assist'||session.isPaused||document.hidden)return;
  const result=assist.request(kind);lastAssistKind=kind;if(result.accepted)revealToy();
  $('arcade-status').textContent=result.accepted?`Ayuda programada: aro ${result.ringId}. ${kind==='thread'?'La mascota lo ensarta.':'Lo soltará sobre la punta.'}`:assistReasons[result.reason??'']??'No se pudo iniciar.';
 });
 for(const [id,count]of [['enemy-one',1],['enemy-two',2]] as const)listen($(id),'click',()=>{
  if(experiment!=='enemy'||session.isPaused||document.hidden)return;
  activateAudio(); const result=enemies.request(count);if(result.accepted)revealToy();
  $('arcade-status').textContent=result.accepted?'El travieso se acerca…':villainReasons[result.reason??'']??'No se pudo iniciar.';
 });
 document.querySelectorAll<HTMLButtonElement>('[data-scene]').forEach(b => listen(b, 'click', () => reset({ scene: b.dataset.scene as Scene })));
 listen($('reset'), 'click', () => reset());
 listen($('model'), 'change', () => {
  const model: ToyModelId = $<HTMLSelectElement>('model').value === '1' ? 'single-button' : 'two-button';
  reset({ model }); savePreferences({ model });
 });
 listen($('game-mode'), 'change', () => reset({ mode: $<HTMLSelectElement>('game-mode').value as GameMode }));
 listen($('strength'), 'input', () => { sim.strength = Number($<HTMLInputElement>('strength').value); $('strength-value').textContent = String(sim.strength); });
 listen($('drag'), 'input', () => { sim.drag = Number($<HTMLInputElement>('drag').value); $('drag-value').textContent = sim.drag.toFixed(2); });
 listen($('pause'), 'click', pause);
 const updateVisibility = () => {
  session.dispatch({ type: 'pause', reason: 'document-hidden', paused: document.hidden });
  resetClock(); frameCount = 0; fpsStart = last; syncPauseView();
 };
 listen(document, 'visibilitychange', updateVisibility); updateVisibility();
 cleanup.push(session.subscribe(event => {
  if (event.roundId !== session.snapshot().roundId) return;
  if (event.type === 'pump') {
   const el = $('pump-' + event.side); clearTimeout(pumpTimers.get(event.side)); el.classList.add('pressed');
   pumpTimers.set(event.side, setTimeout(() => { el.classList.remove('pressed'); pumpTimers.delete(event.side); }, 130));
  }
  if (event.type === 'victory') {
   clearTimeout(winTimer);
   $('win').textContent = event.mode === 'collect' ? 'Todos guardados. ¡Objetivo completo! ✓' : 'Todos dentro. Física comprobada ✓';
   $('win').hidden = false;
   const roundId = event.roundId;
   winTimer = setTimeout(() => { if (!disposed && session.snapshot().roundId === roundId) $('win').hidden = true; }, 3200);
  }
 }));
 const resize = () => lab.resize(), resizeObserver = new ResizeObserver(resize);
 resizeObserver.observe(viewport); resize(); syncRoundView(); $('loading').hidden = true;
 const diagnostics = () => ({
  date: new Date().toISOString(), engine: 'Rapier 0.19.3', renderer: 'Three.js 0.180.0', userAgent: navigator.userAgent,
  viewport: { width: innerWidth, height: innerHeight, pixelRatio: devicePixelRatio }, camera: lab.cameraSnapshot(),
  experiment, labSettings:sim.layout, pressure:{mode:pressure.mode,level:pressure.level,lastPump}, enemy:enemies.status, assist:{...assist.state,uses:assist.scriptedCount},
  tankInterior: { width: 2 * sim.layout.tank.x, height: 2 * sim.layout.tank.y, depth: 2 * sim.layout.tank.z }, jets: sim.layout.jets, pulseDuration: PULSE_DURATION,
  roundId: session.snapshot().roundId, paused: session.pauseReasons, scene: activeScene, model: sim.model, modelId: activeModel, gameMode: sim.mode,
  totalRings: sim.totalRings, collected: sim.collected, ringCount: sim.rings.length, threaded: sim.count, simulationSeconds: sim.time,
  fps: renderFps, averageFrameMs: frameTimes.reduce((a, b) => a + b, 0) / Math.max(1, frameTimes.length),
  maxPhysicsStepMs: maxPhysicsMs, averagePhysicsStepMs: stepSamples.reduce((a, b) => a + b, 0) / Math.max(1, stepSamples.length),
  escaped: sim.escaped, sensorMode: motion.sensorMode, sensorState: motion.state, gravity: { ...sim.gravity },
  strength: sim.strength, drag: sim.drag, physicsHz: 1 / DT, collidersPerRing: RING.segments,
 });
 listen($('export'), 'click', () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(diagnostics(), null, 2)], { type: 'application/json' }));
  downloadUrls.add(url); const a = document.createElement('a'); a.href = url; a.download = 'diagnostico-aritos.json'; a.click();
  setTimeout(() => { URL.revokeObjectURL(url); downloadUrls.delete(url); }, 5000);
 });
 Object.assign(window, { aritosDiagnostics: diagnostics });
 function frame(now: number) {
  if (disposed) return;
  animationFrame = requestAnimationFrame(frame);
  const elapsed = Math.max(0, Math.min((now - last) / 1000, .1)); last = now;
  if (document.hidden) return;
  frameCount++; frameTimes.push(elapsed * 1000); if (frameTimes.length > 600) frameTimes.shift();
  if (now - fpsStart >= 750) { renderFps = Math.round(frameCount * 1000 / (now - fpsStart)); $('fps').textContent = String(renderFps); frameCount = 0; fpsStart = now; }
  if (!session.isPaused) {
   controls.update(elapsed); smoothGravity.lerp(targetGravity, 1 - Math.exp(-elapsed * 9));
   if (smoothGravity.length() < .05) smoothGravity.copy(targetGravity);
   session.dispatch({ type: 'orient', gravity: smoothGravity.clone().normalize().multiplyScalar(3) });
   accumulator += elapsed; let steps = 0;
   while (accumulator >= DT && steps < 12) {
    const t = performance.now();
    if(experiment==='enemy'){
     const result=enemies.beforeStep();if(result){
      $('arcade-status').textContent=result.ok?`¡Travesura! +${result.spawned.length} ${result.spawned.length===1?'aro':'aros'} · objetivo ${sim.totalRings}`:villainReasons[result.reason??'']??'No se añadieron aros.';
      if(result.ok){villainUntil=sim.time+2.2;if(audioEnabled()){void villainCue.play();music.setDucked(true);}}
     }
    }
    if(experiment==='assist')assist.beforeStep();
    session.step(); const ms = performance.now() - t;
    maxPhysicsMs = Math.max(maxPhysicsMs, ms); stepSamples.push(ms); if (stepSamples.length > 600) stepSamples.shift();
    accumulator -= DT; steps++;
   }
   if (steps === 12) accumulator = 0;
  } else accumulator = 0;
  const snapshot = session.snapshot(); renderPocStatus(document, snapshot); lab.render(snapshot, sim,enemies.extraRingIds);
  const villainActive=experiment==='enemy'&&sim.time<villainUntil;
  music.setDucked(villainActive&&audioEnabled()&&!session.isPaused);
  const helpState=assist.state;
  if(lastAssistActive&&!helpState.active&&experiment==='assist')$('arcade-status').textContent=lastAssistKind==='above'?'Aro soltado sobre la punta: la física decide si entra.':'Aro soltado dentro: el contacto real con la base decide el avance.';
  lastAssistActive=helpState.active;
  const mascot=$('lab-mascot');mascot.hidden=!villainActive&&!helpState.active;mascot.classList.toggle('villain',villainActive);
  if(villainActive||helpState.active){
   const position=helpState.position?{x:helpState.position.x+.7,y:helpState.position.y+.5,z:.75}:{x:Math.sin(sim.time*3)*.4,y:3.8,z:.75};
   const point=lab.projectPoint(position);mascot.style.left=Math.max(75,Math.min(viewport.clientWidth-75,point.x))+'px';mascot.style.top=Math.max(40,Math.min(viewport.clientHeight-45,point.y))+'px';
   $('lab-mascot-label').textContent=villainActive?'¡Más aros!':helpState.kind==='thread'?'Ayuda: ensartar':'Ayuda: sobre la punta';
  }
  for(const id of ['assist-thread','assist-above'])$<HTMLButtonElement>(id).disabled=experiment!=='assist'||session.isPaused||snapshot.won||helpState.active;
  for(const id of ['enemy-one','enemy-two'])$<HTMLButtonElement>(id).disabled=experiment!=='enemy'||snapshot.scene!=='free'||snapshot.won||session.isPaused||enemies.extraRingIds.size>0;
  $('count').textContent = (snapshot.mode === 'collect' ? snapshot.collected : sim.count) + ' / ' + snapshot.total;
  if (snapshot.collected > lastCollected) {
   const added = snapshot.collected - lastCollected; lastCollected = snapshot.collected; clearTimeout(collectionFeedbackTimer);
   $('collected-feedback').textContent = `+${added} ${added === 1 ? 'ARO GUARDADO' : 'AROS GUARDADOS'}`;
   $('collected-feedback').hidden = false;
   collectionFeedbackTimer = setTimeout(() => { if (!disposed) $('collected-feedback').hidden = true; }, 1100);
  }
  $('tilt-readout').textContent = sim.gravity.y > 2 ? '↑ BOCA ABAJO' : sim.gravity.y < -2.8 ? '↓ GRAVEDAD NORMAL' : '↗ GRAVEDAD INCLINADA';
  if (sim.escaped) $('status').textContent = 'Revisar: un aro salió del depósito';
 }
 const schedule = () => { if (!disposed) animationFrame = requestAnimationFrame(frame); };
 listen(window, 'pagehide', ((event: PageTransitionEvent) => {
  cancelAnimationFrame(animationFrame); resizeObserver.disconnect(); resetClock();
  if (event.persisted) { session.dispatch({ type: 'pause', reason: 'document-hidden', paused: true }); syncPauseView(); return; }
  disposed = true; cleanup.splice(0).forEach(dispose => dispose());
  assist.dispose(); pressureInput?.dispose(); enemies.dispose(); villainCue.dispose(); music.dispose(); controls.dispose(); motion.dispose(); lab.dispose(); session.dispose();
  clearTimeout(winTimer); clearTimeout(collectionFeedbackTimer); pumpTimers.forEach(clearTimeout); pumpTimers.clear();
  downloadUrls.forEach(url => URL.revokeObjectURL(url)); downloadUrls.clear();
  delete (window as Window & { aritosDiagnostics?: unknown }).aritosDiagnostics;
 }) as EventListener);
 listen(window, 'pageshow', ((event: PageTransitionEvent) => {
  if (event.persisted && !disposed) { updateVisibility(); resizeObserver.observe(viewport); schedule(); }
 }) as EventListener);
 schedule();
}
