import { initPhysics, DT, TANK, RING, JETS, PULSE_DURATION, type Scene, type GameMode, type PumpSide } from '../physics';
import { GameSession, type SessionOptions } from '../game/session';
import { PocControls, PocMotionControls } from '../input/poc-controls';
import { toyModel, type ToyModelId } from '../models/toy-model';
import { createPreferenceStore, type PlayerPreferences } from '../platform/preferences';
import { PocLab } from '../lab/poc-lab';
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
 function resetClock() { accumulator = 0; last = performance.now(); }
 function syncPauseView() {
  const manual = session.pauseReasons.includes('manual');
  $('pause').textContent = manual ? '▶ Continuar' : 'Ⅱ Pausar';
  $('paused-label').hidden = !session.isPaused;
  $('status').textContent = session.isPaused ? 'Simulación en pausa' : 'Simulación en marcha';
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
  pump: side => { if (!document.hidden) session.dispatch({ type: 'pump', side }); },
  togglePause: pause, setManualTilt: manualTilt,
 }, { left: $('pump-left'), right: $('pump-right'), center: $('pump-center') });
 function center() { motion.center(); controls.resetTilt(0, 0, false); }
 listen($('upright'), 'click', center);
 listen($('invert'), 'click', () => { manualTilt(180, 0); controls.resetTilt(180, 0, false); });
 for (const name of ['roll', 'pitch'] as const) listen($(name), 'input', () => {
  const roll = Number($<HTMLInputElement>('roll').value), pitch = Number($<HTMLInputElement>('pitch').value);
  manualTilt(roll, pitch); controls.syncTilt(roll, pitch);
 });
 function syncRoundView() {
  const snapshot = session.snapshot(); activeScene = snapshot.scene; activeModel = snapshot.model;
  const model = toyModel(activeModel); lab.updateOutlets(activeModel);
  $<HTMLSelectElement>('model').value = String(model.buttonCount);
  $<HTMLSelectElement>('game-mode').value = snapshot.mode;
  for (const side of ['left', 'right', 'center'] as const) $('pump-' + side).hidden = !model.pumpSides.includes(side);
  $('count-label').textContent = snapshot.mode === 'collect' ? 'GUARDADOS' : 'ENSARTADOS';
  $('count').textContent = '0 / ' + snapshot.total;
  $('mode-hint').textContent = snapshot.mode === 'collect'
   ? 'Al llegar a la base, el aro se guarda y tu progreso queda acumulado.'
   : 'Mantén todos los aros ensartados durante dos segundos. Pueden volver a salir.';
  const labels = { free: '01 / JUEGO LIBRE', drop: '02 / CAÍDA Y CHOQUE', stack: '03 / APILAR Y EXTRAER', depth: '04 / PROFUNDIDAD' };
  $('scene-label').textContent = labels[activeScene];
  document.querySelectorAll<HTMLButtonElement>('[data-scene]').forEach(b => b.classList.toggle('active', b.dataset.scene === activeScene));
  syncPauseView();
 }
 function reset(options: SessionOptions = {}) {
  session.dispatch({ type: 'start', options });
  center(); smoothGravity.copy(targetGravity); resetClock();
  clearTimeout(winTimer); clearTimeout(collectionFeedbackTimer);
  for (const [side, timer] of pumpTimers) { clearTimeout(timer); $('pump-' + side).classList.remove('pressed'); }
  pumpTimers.clear(); lastCollected = 0;
  $('win').hidden = true; $('collected-feedback').hidden = true;
  syncRoundView();
 }
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
  tankInterior: { width: 2 * TANK.x, height: 2 * TANK.y, depth: 2 * TANK.z }, jets: JETS, pulseDuration: PULSE_DURATION,
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
    const t = performance.now(); session.step(); const ms = performance.now() - t;
    maxPhysicsMs = Math.max(maxPhysicsMs, ms); stepSamples.push(ms); if (stepSamples.length > 600) stepSamples.shift();
    accumulator -= DT; steps++;
   }
   if (steps === 12) accumulator = 0;
  } else accumulator = 0;
  const snapshot = session.snapshot(); renderPocStatus(document, snapshot); lab.render(snapshot, sim);
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
  if (event.persisted) { session.dispatch({ type: 'pause', reason: 'document-hidden', paused: true }); return; }
  disposed = true; cleanup.splice(0).forEach(dispose => dispose());
  controls.dispose(); motion.dispose(); lab.dispose(); session.dispose();
  clearTimeout(winTimer); clearTimeout(collectionFeedbackTimer); pumpTimers.forEach(clearTimeout); pumpTimers.clear();
  downloadUrls.forEach(url => URL.revokeObjectURL(url)); downloadUrls.clear();
  delete (window as Window & { aritosDiagnostics?: unknown }).aritosDiagnostics;
 }) as EventListener);
 listen(window, 'pageshow', ((event: PageTransitionEvent) => {
  if (event.persisted && !disposed) { updateVisibility(); resizeObserver.observe(viewport); schedule(); }
 }) as EventListener);
 schedule();
}
