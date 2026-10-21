import { PLAYER_TOY_SETTINGS, PLAYER_TOY_LAYOUT } from '../models/selected-toy';
import { PlayerMascots } from '../game/mascots/player-mascots';
import { GameSession, type PauseReason } from '../game/session';
import { DT, initPhysics, type Scene } from '../physics';
import { PocControls, PocMotionControls } from '../input/poc-controls';
import { createPreferenceStore, type PlayerPreferences } from '../platform/preferences';
import { mountPlayerUI } from '../ui/player-view';
import { PlayerRenderer } from '../rendering/player-renderer';
import { theme } from '../themes';
import { createAudioController } from '../audio/audio-controller';
import { createMusicController } from '../audio/theme-music';
import { createStickerFeature, DEFAULT_STICKERS, type StickerFeature } from '../stickers';
import { createCelebration } from '../celebration/celebration-controller';

/** Owns app composition and teardown; physical rules stay in GameSession. */
export async function startPlayer(root: HTMLElement, options: { labScene?: Scene } = {}) {
 await initPhysics();
 const store = createPreferenceStore();
 let preferences = store.load();
 const session = new GameSession({ model: preferences.model, mode: 'collect', scene: options.labScene ?? 'free', lab: PLAYER_TOY_SETTINGS });
 session.dispatch({ type: 'pause', reason: 'menu', paused: true });
 let started = false, disposed = false, pageSuspended = false;
 let accumulator = 0, last = performance.now(), animationFrame = 0;
 let feedback = '', feedbackUntil = 0, victory = '', victoryUntil = 0;
 const cleanup: Array<() => void> = [];
 const pressedTimers = new Map<HTMLElement, ReturnType<typeof setTimeout>>();
 const listen = (target: EventTarget, event: string, action: EventListener) => {
  target.addEventListener(event, action); cleanup.push(() => target.removeEventListener(event, action));
 };
 const resetClock = () => { accumulator = 0; last = performance.now(); };
 const audio = createAudioController({ enabled: preferences.sound, roundId: 0, collectionSound: preferences.collectionSound });
 const music = createMusicController({ enabled: preferences.sound && preferences.music, theme: preferences.theme });
 let view: ReturnType<typeof mountPlayerUI>;
 let renderer: PlayerRenderer;
 let celebration: ReturnType<typeof createCelebration>;
 let motion: PocMotionControls;
 let controls: PocControls;
 let stickers: StickerFeature | undefined;
 let mascots: PlayerMascots | undefined;
 const syncPause = () => {
  audio.cancelPreview();
  mascots?.setPaused(session.isPaused);
  audio.setPaused(session.isPaused); music.setPaused(session.isPaused); celebration?.setPaused(session.isPaused);
  resetClock();
 };
 const pause = (reason: PauseReason, paused: boolean) => {
  session.dispatch({ type: 'pause', reason, paused }); syncPause();
  // An already unlocked context can resume after closing a menu or returning to the page.
  if (!session.isPaused && started) { void audio.activate(); void music.activate(); }
 };
 const save = (changes: Partial<PlayerPreferences>) => {
  const previous = preferences;
  preferences = Object.freeze({ ...preferences, ...changes });
  store.save(preferences);
  if (preferences.theme !== previous.theme) {
   renderer?.setTheme(preferences.theme); celebration?.setTheme(preferences.theme); music.setTheme(preferences.theme);
   stickers?.setRound(session.snapshot().roundId, preferences.theme);
  }
  const ui = theme(preferences.theme).ui;
  for (const [name, value] of Object.entries({ accent: ui.accent, 'accent-text': ui.accentText, ink: ui.text, muted: ui.muted })) root.style.setProperty('--' + name, value);
  audio.setEnabled(preferences.sound);
  audio.setCollectionSound(preferences.collectionSound);
  music.setEnabled(preferences.sound && preferences.music);
  mascots?.setAudioEnabled(preferences.sound && preferences.music);
  if (preferences.sound && !session.isPaused) { void audio.activate(); void music.activate(); }
 };
 const manualTilt = (roll: number, pitch: number) => {
  motion.setManual(roll, pitch);
  if (preferences.control !== 'manual') save({ control: 'manual' });
 };
 const center = () => { motion.center(); controls.resetTilt(0, 0, false); };
 const freshRound = (model = preferences.model, mode = session.snapshot().mode) => {
  stickers?.close(); mascots?.reset();
  session.startRound({ model, mode, scene: options.labScene ?? 'free' });
  started = true;
  audio.setRound(session.snapshot().roundId); celebration.setRound(session.snapshot().roundId);
  renderer.setModel(model);
  stickers?.setRound(session.snapshot().roundId, preferences.theme);
  feedback = ''; victory = ''; feedbackUntil = 0; victoryUntil = 0;
  for (const [element, timer] of pressedTimers) { clearTimeout(timer); element.classList.remove('pressed'); }
  pressedTimers.clear();
  center(); smoothGravity.copy(motion.gravity);
  pause('document-hidden', document.hidden || pageSuspended);
  renderer.resize(); stickers?.refresh();
 };
 view = mountPlayerUI(root, preferences, {
  onAssist: kind => { if (started) mascots?.requestAssist(kind); },
  onVillain: count => { if (started) mascots?.requestVillain(count); },
  onStart: (next, mode) => { save({ ...next, control: preferences.control }); freshRound(next.model, mode); void audio.activate(); void music.activate(); },
  onPreferenceChange: changes => save(changes),
  onPause: (reason, paused) => { pause(reason, paused); if (reason === 'menu' && paused) stickers?.close(); },
  onRecenter: center,
  onRestart: () => freshRound(),
  onDecorate: () => { if (started) stickers?.open(); },
  onPreviewSound: () => document.hidden || pageSuspended ? Promise.resolve(false) : audio.previewCollectionSound(),
 });
 const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 renderer = new PlayerRenderer(view.refs.viewport, { model: preferences.model, theme: preferences.theme, quality: reduced ? 'reduced' : 'high', layout: PLAYER_TOY_LAYOUT });
 mascots = new PlayerMascots(session, active => music.setDucked(active));
 const mascotActor = view.refs.viewport.querySelector<HTMLElement>('#player-mascot')!;
 stickers = createStickerFeature(view.refs.viewport, { catalog: DEFAULT_STICKERS, getSurface: () => renderer.toySurfaceBounds(), onEditingChange: editing => pause('decoration', editing), eligible: !options.labScene });
 celebration = createCelebration(view.refs.viewport, { theme: preferences.theme, roundId: 0, quality: reduced ? 'reduced' : 'high' });
 motion = new PocMotionControls({ ...view.refs.motion, onGravity: () => {
  if (motion.sensorMode && preferences.control !== 'motion') save({ control: 'motion' });
 } });
 const smoothGravity = motion.gravity.clone();
 controls = new PocControls({
  model: () => session.snapshot().model,
  paused: () => !started || session.isPaused || document.hidden,
  pump: side => {
   if (!started || document.hidden || session.isPaused) return;
   void audio.activate(); void music.activate(); session.dispatch({ type: 'pump', side });
  },
  togglePause: () => { if (started) pause('manual', !session.pauseReasons.includes('manual')); },
  setManualTilt: manualTilt,
 }, view.refs.controls);
 for (const element of [view.refs.motion.rollValue, view.refs.motion.pitchValue]) listen(element, 'input', () => {
  const roll = Number(view.refs.motion.rollValue.value), pitch = Number(view.refs.motion.pitchValue.value);
  manualTilt(roll, pitch); controls.syncTilt(roll, pitch);
 });
 listen(view.refs.invert, 'click', () => { manualTilt(180, 0); controls.resetTilt(180, 0, false); });
 cleanup.push(session.subscribe(event => {
  if (event.roundId !== session.snapshot().roundId) return;
  audio.handle(event); celebration.handle(event); stickers?.handle(event);
  if (event.type === 'pump') {
   renderer.pulse(event.side);
   const element = view.refs.controls[event.side]; clearTimeout(pressedTimers.get(element)); element.classList.add('pressed');
   pressedTimers.set(element, setTimeout(() => { element.classList.remove('pressed'); pressedTimers.delete(element); }, 140));
  } else if (event.type === 'ring-collected') {
   feedback = '+1 aro guardado'; feedbackUntil = performance.now() + 1100;
  } else {
   victory = event.mode === 'collect' ? '¡Todos guardados! Lo lograste.' : '¡Todos ensartados! Lo lograste.';
   victoryUntil = performance.now() + 4000;
  }
 }));
 const resizeObserver = new ResizeObserver(() => { renderer.resize(); stickers?.refresh(); }); resizeObserver.observe(view.refs.viewport);
 const updateVisibility = () => { pause('document-hidden', document.hidden || pageSuspended); if (document.hidden || pageSuspended) stickers?.close(); };
 listen(document, 'visibilitychange', updateVisibility); updateVisibility(); save({});
 function frame(now: number) {
  if (disposed || pageSuspended) return;
  animationFrame = requestAnimationFrame(frame);
  const elapsed = Math.max(0, Math.min((now - last) / 1000, .1)); last = now;
  if (document.hidden) return;
  if (started && !session.isPaused) {
   controls.update(elapsed);
   smoothGravity.lerp(motion.gravity, 1 - Math.exp(-elapsed * 9));
   if (smoothGravity.length() < .05) smoothGravity.copy(motion.gravity);
   session.dispatch({ type: 'orient', gravity: smoothGravity.clone().normalize().multiplyScalar(3) });
   accumulator += elapsed; let steps = 0;
   while (accumulator >= DT && steps < 12) { mascots?.beforeStep(); session.step(); accumulator -= DT; steps++; }
   if (steps === 12) accumulator = 0;
  } else accumulator = 0;
  const snapshot = session.snapshot();
  mascots?.update();
  const mascotState = mascots?.state;
  mascotActor.hidden = !mascotState?.actor;
  if (mascotState?.actor) {
   const actor = mascotState.actor;
   const point = renderer.projectPoint({ x:actor.position.x+.5, y:actor.position.y+.5, z:.75 });
   mascotActor.style.left = Math.max(72,Math.min(view.refs.viewport.clientWidth-72,point.x))+'px';
   mascotActor.style.top = Math.max(60,Math.min(view.refs.viewport.clientHeight-38,point.y))+'px';
   mascotActor.classList.toggle('is-villain',actor.villain);
   mascotActor.querySelector('span')!.textContent = actor.caption;
  }
  view.update(snapshot, preferences, { mascots: mascotState, paused: session.isPaused, motionState: motion.state, motionMessage: motion.capabilityMessage,
   feedback: now < feedbackUntil ? feedback : '', victory: now < victoryUntil ? victory : '' });
  if (started) renderer.render(snapshot, mascots?.extraRingIds);
 }
 function dispose() {
  if (disposed) return; disposed = true; cancelAnimationFrame(animationFrame); resizeObserver.disconnect();
  cleanup.splice(0).forEach(remove => remove()); pressedTimers.forEach(clearTimeout); pressedTimers.clear();
  mascots?.dispose(); stickers?.dispose(); controls.dispose(); motion.dispose(); celebration.dispose(); audio.dispose(); music.dispose(); renderer.dispose(); session.dispose(); view.dispose();
 }
 listen(window, 'pagehide', ((event: PageTransitionEvent) => {
  if (!event.persisted) { dispose(); return; }
  pageSuspended = true; cancelAnimationFrame(animationFrame); updateVisibility();
 }) as EventListener);
 listen(window, 'pageshow', ((event: PageTransitionEvent) => {
  if (event.persisted && !disposed) { pageSuspended = false; updateVisibility(); renderer.resize(); animationFrame = requestAnimationFrame(frame); }
 }) as EventListener);
 animationFrame = requestAnimationFrame(frame);
 return { dispose };
}
