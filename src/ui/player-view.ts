import type { GameMode } from '../physics';
import type { SessionSnapshot, PauseReason } from '../game/session';
import type { ToyModelId } from '../models/toy-model';
import type { PlayerPreferences, ThemeId } from '../platform/preferences';

export type PlayerUIState = Readonly<{
  paused?: boolean;
  feedback?: string;
  victory?: string;
  motionMessage?: string;
  motionState?: 'manual' | 'unavailable' | 'waiting' | 'usable' | 'denied' | 'unusable-data';
}>;

export type PlayerUIHandlers = Readonly<{
  onStart: (preferences: PlayerPreferences, mode: GameMode) => void;
  onPreferenceChange: (changes: Partial<PlayerPreferences>) => void;
  onPause: (reason: PauseReason, paused: boolean) => void;
  onRecenter: () => void;
  onRestart: () => void;
  onPreviewSound: () => Promise<boolean>;
}>;

export type PlayerUIRefs = Readonly<{
  viewport: HTMLElement;
  controls: Readonly<{ left: HTMLButtonElement; right: HTMLButtonElement; center: HTMLButtonElement }>;
  motion: Readonly<{
    button: HTMLButtonElement; status: HTMLElement;
    rollValue: HTMLInputElement; pitchValue: HTMLInputElement;
    rollLabel: HTMLElement; pitchLabel: HTMLElement;
  }>;
  upright: HTMLButtonElement;
  invert: HTMLButtonElement;
}>;

const THEME_NAMES: Record<ThemeId, string> = { ocean: 'Océano', space: 'Espacio', capybaras: 'Capibaras' };
const MODEL_NAMES: Record<ToyModelId, string> = { 'two-button': 'Dos botones', 'single-button': 'Un botón' };
const CAPYBARA_ICON = '<svg viewBox="0 0 32 24" role="img" aria-label="Capibara"><path fill="currentColor" d="M4 15c0-4.4 3.8-7.7 9.1-8.3 2-.2 4.1.2 5.9 1.1l3.4-.3c1.2-.1 2.2.6 2.5 1.7l.3 1.1 2.5 1.2c1.1.5 1.8 1.6 1.8 2.8v2.2h-3.4c-.3 2.3-1.5 3.5-2.8 3.5-1.2 0-2.2-1.1-2.5-3.3h-8.1c-.3 2.2-1.4 3.3-2.7 3.3s-2.4-1.2-2.7-3.3H4v-1.7Zm17.8-6.1 1.2-2.1c.4-.7 1.3-.9 2-.5.7.4.9 1.3.5 2l-.7 1.2-3-.6ZM5 10.2 3.6 8.6c-.5-.6-.4-1.5.2-2.1.6-.5 1.5-.4 2.1.2l1.5 1.7-2.4 1.8Zm15.6 2.4a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Z"/></svg>';
const THEMES: Array<{ id: ThemeId; icon: string; detail: string }> = [
  { id: 'ocean', icon: '🐙', detail: 'Aventura bajo el mar' },
  { id: 'space', icon: '🚀', detail: 'Misión entre estrellas' },
  { id: 'capybaras', icon: CAPYBARA_ICON, detail: 'Un chapuzón tranquilo' },
];

function themeChoices(selected: ThemeId): string {
  return THEMES.map(theme => `<button class="theme-choice ${selected === theme.id ? 'is-selected' : ''}" type="button" data-theme="${theme.id}" aria-pressed="${selected === theme.id}" aria-label="Tema ${THEME_NAMES[theme.id]}">
    <span class="theme-emoji" aria-hidden="true">${theme.icon}</span><span><b>${THEME_NAMES[theme.id]}</b><small>${theme.detail}</small></span>
  </button>`).join('');
}

/** Mounts the Spanish player shell; pump and motion behavior remains owned by PocControls. */
export function mountPlayerUI(root: HTMLElement, initialPreferences: PlayerPreferences, handlers: PlayerUIHandlers) {
  root.classList.add('aritos-player');
  root.innerHTML = `
    <main class="player-shell" aria-label="Aritos">
      <header class="player-header">
        <a class="brand" href="#" aria-label="Aritos, inicio"><span class="brand-mark" aria-hidden="true">◎</span><span>Aritos</span></a>
        <div class="header-actions"><span class="theme-pill" id="player-theme-pill"></span><button class="icon-button" id="settings-open" type="button" aria-label="Abrir ajustes" aria-haspopup="dialog">⚙</button></div>
      </header>
      <section class="setup-screen" id="setup-screen" aria-labelledby="setup-title">
        <div class="setup-copy"><p class="eyebrow">TU JUGUETE, TU AVENTURA</p><h1 id="setup-title">¡Aros al agua!</h1><p>Impulsa, inclina y encuentra el ángulo perfecto para ensartar cada aro.</p></div>
        <div class="setup-card">
          <fieldset class="choice-group"><legend>Elige tu juguete</legend><div class="model-choices">
            <button class="model-choice" type="button" data-model="two-button" aria-pressed="false"><span class="toy-mini two" aria-hidden="true"><i></i><i></i></span><b>Dos botones</b><small>Dirige el agua desde ambos lados</small></button>
            <button class="model-choice" type="button" data-model="single-button" aria-pressed="false"><span class="toy-mini one" aria-hidden="true"><i></i></span><b>Un botón</b><small>Un impulso central y directo</small></button>
          </div></fieldset>
          <fieldset class="choice-group"><legend>Elige un tema</legend><div class="theme-choices" id="setup-themes">${themeChoices(initialPreferences.theme)}</div></fieldset>
          <fieldset class="choice-group rule-group"><legend>Cómo quieres jugar</legend><div class="rule-choices"><button class="rule-choice is-selected" type="button" data-mode="collect" aria-pressed="true"><b>Guardar al llegar</b><small>Los aros quedan guardados al tocar la base</small></button><button class="rule-choice" type="button" data-mode="classic" aria-pressed="false"><b>Modo clásico</b><small>Mantén todos los aros ensartados a la vez</small></button></div></fieldset>
          <button class="primary-button" id="start-game" type="button">Jugar <span aria-hidden="true">→</span></button>
          <button class="text-button" id="help-open" type="button">¿Cómo se juega?</button>
        </div>
        <p class="setup-footnote">Sin reloj ni vidas. Juega a tu ritmo.</p>
      </section>
      <section class="game-screen" id="game-screen" aria-label="Partida" hidden>
        <div class="game-topline"><div><p class="eyebrow" id="round-label">RETO CLÁSICO</p><p class="progress-copy"><strong id="count">0 / 12</strong><span id="count-label">AROS GUARDADOS</span></p></div><button class="compact-button" id="game-help-open" type="button" aria-haspopup="dialog">? <span>Ayuda</span></button></div>
        <div class="toy-stage" id="toy-stage"><div class="stage-glow" aria-hidden="true"></div><div class="viewport" id="viewport" aria-label="Juguete de agua en 3D"></div><div class="stage-status" id="player-status" aria-live="polite"></div><div class="feedback-toast" id="feedback-toast" role="status" hidden></div></div>
        <div class="pump-deck" aria-label="Botones de bombeo">
          <button class="pump-button pump-side" id="pump-left" type="button" aria-label="Bombear lado izquierdo"><span class="pump-icon" aria-hidden="true">↗</span><span>Bombear</span></button>
          <button class="pump-button pump-center" id="pump-center" type="button" aria-label="Bombear"><span class="pump-icon" aria-hidden="true">↑</span><span>Bombear</span></button>
          <div class="pump-hint" id="pump-hint">Toca para impulsar</div>
          <button class="pump-button pump-side" id="pump-right" type="button" aria-label="Bombear lado derecho"><span class="pump-icon" aria-hidden="true">↖</span><span>Bombear</span></button>
        </div>
        <section class="tilt-panel" id="tilt-panel" aria-label="Control manual de inclinación">
          <div class="tilt-heading"><span><b>Inclina el juguete</b><small>También puedes inclinar mientras bombeas</small></span><button class="text-button small" id="invert" type="button">↻ Invertir</button></div>
          <div class="tilt-sliders">
            <label><span>Lado a lado <output id="roll-value">0°</output></span><input id="roll" type="range" min="-180" max="180" value="0" aria-label="Inclinar de lado a lado"></label>
            <label><span>Adelante / atrás <output id="pitch-value">0°</output></span><input id="pitch" type="range" min="-180" max="180" value="0" aria-label="Inclinar adelante o atrás"></label>
          </div>
          <div class="motion-row"><span id="sensor-status" aria-live="polite">Control manual activo. Puedes usar movimiento si tu dispositivo lo permite.</span><button class="outline-button" id="sensor" type="button">Usar movimiento</button></div>
          <button class="text-button small center-button" id="upright" type="button">◎ Centrar inclinación</button>
        </section>
      </section>
      <dialog class="player-dialog" id="settings-dialog" aria-labelledby="settings-title">
        <form method="dialog" class="dialog-content"><div class="dialog-heading"><div><p class="eyebrow">TU PARTIDA</p><h2 id="settings-title">Ajustes</h2></div><button class="icon-button dialog-close" value="close" aria-label="Cerrar ajustes">×</button></div>
          <button class="setting-row" id="pause-toggle" type="button"><span class="setting-icon">Ⅱ</span><span><b id="pause-title">Pausar partida</b><small>Detiene el movimiento mientras estás aquí</small></span><span class="setting-arrow">›</span></button>
          <div class="setting-section"><b>Tema</b><div class="theme-choices compact" id="settings-themes">${themeChoices(initialPreferences.theme)}</div></div>
          <button class="setting-row" id="sound-toggle" type="button" aria-pressed="${initialPreferences.sound}"><span class="setting-icon">♫</span><span><b>Sonido general</b><small id="sound-copy">${initialPreferences.sound ? 'Activados' : 'Silenciados'}</small></span><span class="toggle-indicator" aria-hidden="true"></span></button>
          <button class="setting-row" id="music-toggle" type="button" aria-pressed="${initialPreferences.music}"><span class="setting-icon">♪</span><span><b>Música del tema</b><small id="music-copy"></small></span><span class="toggle-indicator" aria-hidden="true"></span></button>
          <div class="setting-section reward-setting"><label for="collection-sound"><b>Al guardar un aro</b></label><div class="reward-controls"><select id="collection-sound" aria-label="Sonido al guardar un aro"><option value="coin">Monedita</option><option value="sparkle">Chispas</option></select><button class="compact-button" id="preview-sound" type="button">Escuchar</button></div><small id="preview-sound-status" role="status">Elige tu sonido de recompensa.</small></div>
          <button class="setting-row" id="controls-open" type="button"><span class="setting-icon">↗</span><span><b>Controles e inclinación</b><small>Movimiento del dispositivo o ajuste manual</small></span><span class="setting-arrow">›</span></button>
          <button class="setting-row" id="rule-change" type="button"><span class="setting-icon">◎</span><span><b>Cambiar modo de juego</b><small>Guardar al llegar o jugar en modo clásico</small></span><span class="setting-arrow">›</span></button>
          <button class="setting-row" id="model-change" type="button"><span class="setting-icon">▣</span><span><b>Cambiar juguete</b><small id="model-copy">${MODEL_NAMES[initialPreferences.model]}</small></span><span class="setting-arrow">›</span></button>
          <button class="setting-row" id="restart-open" type="button"><span class="setting-icon">↻</span><span><b>Empezar de nuevo</b><small>Vuelve a colocar todos los aros</small></span><span class="setting-arrow">›</span></button>
          <p class="keyboard-tip">En computadora: A/D bombea · Espacio, ambos · Flechas o W/S, inclinar · P, pausar</p>
        </form>
      </dialog>
      <dialog class="player-dialog narrow" id="restart-dialog" aria-labelledby="restart-title">
        <div class="dialog-content"><p class="eyebrow">NUEVA RONDA</p><h2 id="restart-title">¿Empezamos de nuevo?</h2><p>Tu progreso de esta partida se reiniciará.</p><div class="dialog-actions"><button class="outline-button" id="restart-cancel" type="button">Seguir jugando</button><button class="danger-button" id="restart-confirm" type="button">Reiniciar</button></div></div>
      </dialog>
      <dialog class="player-dialog narrow" id="help-dialog" aria-labelledby="help-title">
        <form method="dialog" class="dialog-content"><div class="dialog-heading"><div><p class="eyebrow">EN TRES PASOS</p><h2 id="help-title" tabindex="-1">¿Cómo se juega?</h2></div><button class="icon-button dialog-close" value="close" aria-label="Cerrar ayuda">×</button></div>
          <ol class="help-steps"><li><span>1</span><div><b>Bombea</b><small>Toca los botones debajo del depósito para impulsar los aros.</small></div></li><li><span>2</span><div><b>Inclina</b><small>Usa los controles para mover el agua en cualquier dirección, incluso boca abajo.</small></div></li><li><span>3</span><div><b>Ensarta</b><small>Guía cada aro hasta una estaca. En esta ronda, los aros que llegan a la base quedan guardados.</small></div></li></ol>
          <p class="help-note">En el modo clásico, mantén todos los aros ensartados a la vez.</p><button class="primary-button" value="close">¡Entendido!</button>
        </form>
      </dialog>
    </main>`;

  const $ = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  let currentPreferences = initialPreferences;
  let lastPreferenceSync = initialPreferences;
  let draftModel = initialPreferences.model;
  let modelDraftDirty = false;
  let activeModel = initialPreferences.model;
  let mode: GameMode = 'collect';
  let started = false;
  let disposed = false;
  let scheduledFrame = 0;
  let latestSnapshot: SessionSnapshot | undefined;
  const settings = $('#settings-dialog') as HTMLDialogElement;
  const restart = $('#restart-dialog') as HTMLDialogElement;
  const help = $('#help-dialog') as HTMLDialogElement;
  const prefsFromChoices = () => ({ ...currentPreferences, model: draftModel });
  const setPreference = (changes: Partial<PlayerPreferences>) => {
    currentPreferences = { ...currentPreferences, ...changes };
    lastPreferenceSync = currentPreferences;
    handlers.onPreferenceChange(changes); syncPrefs();
  };
  const syncPrefs = () => {
    root.dataset.theme = currentPreferences.theme;
    root.dataset.control = currentPreferences.control;
    const theme = THEMES.find(t => t.id === currentPreferences.theme)!;
    $('#player-theme-pill').innerHTML = `<span class="theme-pill-icon" aria-hidden="true">${theme.icon}</span>${THEME_NAMES[currentPreferences.theme]}`;
    root.querySelectorAll<HTMLButtonElement>('[data-theme]').forEach(button => {
      const selected = button.dataset.theme === currentPreferences.theme;
      button.classList.toggle('is-selected', selected); button.setAttribute('aria-pressed', String(selected));
    });
    root.querySelectorAll<HTMLButtonElement>('[data-model]').forEach(button => {
      const selected = button.dataset.model === draftModel;
      button.classList.toggle('is-selected', selected); button.setAttribute('aria-pressed', String(selected));
    });
    $('#sound-toggle').setAttribute('aria-pressed', String(currentPreferences.sound));
    $('#sound-copy').textContent = currentPreferences.sound ? 'Activados' : 'Silenciados';
    $('#music-toggle').setAttribute('aria-pressed', String(currentPreferences.music));
    $('#music-copy').textContent = !currentPreferences.music ? 'Desactivada' : !currentPreferences.sound ? 'Silenciada por el sonido general' : 'Activada · ' + THEME_NAMES[currentPreferences.theme];
    $<HTMLSelectElement>('#collection-sound').value = currentPreferences.collectionSound;
    $<HTMLButtonElement>('#preview-sound').disabled = !currentPreferences.sound;
    $('#model-copy').textContent = MODEL_NAMES[draftModel];
    $('#pump-hint').textContent = draftModel === 'single-button' ? 'Un impulso central por toque' : 'Toca uno o ambos botones';
  };
  const chooseModel = (model: ToyModelId) => { draftModel = model; modelDraftDirty = true; syncPrefs(); };
  root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.mode as GameMode;
    root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(option => { const selected = option === button; option.classList.toggle('is-selected', selected); option.setAttribute('aria-pressed', String(selected)); });
  }));
  root.querySelectorAll<HTMLButtonElement>('[data-model]').forEach(button => button.addEventListener('click', () => chooseModel(button.dataset.model as ToyModelId)));
  root.querySelectorAll<HTMLButtonElement>('[data-theme]').forEach(button => button.addEventListener('click', () => setPreference({ theme: button.dataset.theme as ThemeId })));
  $('#start-game').addEventListener('click', () => {
    started = true; activeModel = draftModel; modelDraftDirty = false;
    if (currentPreferences.model !== draftModel) {
      currentPreferences = { ...currentPreferences, model: draftModel };
      lastPreferenceSync = currentPreferences; handlers.onPreferenceChange({ model: draftModel });
    }
    $('#setup-screen').hidden = true; $('#game-screen').hidden = false;
    handlers.onStart(prefsFromChoices(), mode);
    $('#pump-left').hidden = draftModel !== 'two-button'; $('#pump-right').hidden = draftModel !== 'two-button'; $('#pump-center').hidden = draftModel !== 'single-button';
  });
  $('#settings-open').addEventListener('click', () => {
    for (const id of ['pause-toggle','controls-open','rule-change','model-change','restart-open']) $<HTMLButtonElement>('#'+id).disabled = !started;
    handlers.onPause('menu', true); settings.showModal();
  });
  settings.addEventListener('close', () => { if (!disposed) handlers.onPause('menu', !started); });
  $('#pause-toggle').addEventListener('click', () => handlers.onPause('manual', !latestSnapshot?.paused.includes('manual')));
  $('#sound-toggle').addEventListener('click', () => setPreference({ sound: !currentPreferences.sound }));
  $('#music-toggle').addEventListener('click', () => setPreference({ music: !currentPreferences.music }));
  $('#collection-sound').addEventListener('change', () => {
    setPreference({ collectionSound: $<HTMLSelectElement>('#collection-sound').value === 'sparkle' ? 'sparkle' : 'coin' });
    $('#preview-sound-status').textContent = 'Pulsa Escuchar para comparar.';
  });
  $('#preview-sound').addEventListener('click', async () => {
    const played = await handlers.onPreviewSound();
    if (!disposed) $('#preview-sound-status').textContent = played ? 'Muestra de ' + (currentPreferences.collectionSound === 'coin' ? 'monedita.' : 'chispas.') : 'No se pudo activar el audio. Puedes seguir jugando.';
  });
  $('#controls-open').addEventListener('click', () => { settings.close(); scheduledFrame = requestAnimationFrame(() => { scheduledFrame = 0; $('#tilt-panel').scrollIntoView({ behavior: 'smooth', block: 'center' }); refs.motion.button.focus(); }); });
  const returnToSetup = (includeModel: boolean) => {
    if (!includeModel || !modelDraftDirty) { draftModel = activeModel; modelDraftDirty = false; syncPrefs(); }
    started = false; settings.close(); $('#setup-screen').hidden = false; $('#game-screen').hidden = true;
  };
  $('#rule-change').addEventListener('click', () => returnToSetup(false));
  $('#model-change').addEventListener('click', () => returnToSetup(true));
  $('#restart-open').addEventListener('click', () => { handlers.onPause('restart-confirmation', true); settings.close(); restart.showModal(); });
  $('#restart-cancel').addEventListener('click', () => { restart.close(); handlers.onPause('restart-confirmation', false); });
  $('#restart-confirm').addEventListener('click', () => { restart.close(); handlers.onPause('restart-confirmation', false); handlers.onRestart(); });
  restart.addEventListener('cancel', () => { if (!disposed) handlers.onPause('restart-confirmation', false); });
  const openHelp = () => {
    const helpMode = started ? latestSnapshot?.mode ?? mode : mode;
    $('.help-steps li:nth-child(3) small').textContent = helpMode === 'collect'
      ? 'Guía cada aro hasta una estaca. Al llegar a la base queda guardado durante esta partida.'
      : 'Guía todos los aros hasta las estacas y mantenlos ensartados dos segundos. Pueden volver a salir.';
    handlers.onPause('menu', true); help.showModal();
    scheduledFrame = requestAnimationFrame(() => { scheduledFrame = 0; $('#help-title').focus(); });
  };
  $('#help-open').addEventListener('click', openHelp);
  $('#game-help-open').addEventListener('click', openHelp);
  help.addEventListener('close', () => { if (!disposed) handlers.onPause('menu', !started); });
  $('#upright').addEventListener('click', handlers.onRecenter);
  syncPrefs();

  const refs: PlayerUIRefs = {
    viewport: $('#viewport'), controls: { left: $('#pump-left'), right: $('#pump-right'), center: $('#pump-center') },
    motion: { button: $('#sensor'), status: $('#sensor-status'), rollValue: $('#roll'), pitchValue: $('#pitch'), rollLabel: $('#roll-value'), pitchLabel: $('#pitch-value') },
    upright: $('#upright'), invert: $('#invert'),
  };
  return {
    refs,
    update(snapshot: SessionSnapshot, preferences: PlayerPreferences, nextState: PlayerUIState = {}) {
      latestSnapshot = snapshot;
      if (preferences.model !== lastPreferenceSync.model || preferences.theme !== lastPreferenceSync.theme || preferences.sound !== lastPreferenceSync.sound || preferences.music !== lastPreferenceSync.music || preferences.collectionSound !== lastPreferenceSync.collectionSound || preferences.control !== lastPreferenceSync.control) {
        if (!modelDraftDirty && preferences.model !== lastPreferenceSync.model) draftModel = preferences.model;
        currentPreferences = preferences;
        lastPreferenceSync = preferences;
        syncPrefs();
      }
      $('#count').textContent = `${snapshot.mode === 'collect' ? snapshot.collected : snapshot.rings.filter(r => r.threaded).length} / ${snapshot.total}`;
      $('#count-label').textContent = snapshot.mode === 'collect' ? 'AROS GUARDADOS' : 'AROS ENSARTADOS';
      $('#round-label').textContent = snapshot.mode === 'collect' ? 'RETO · GUARDAR AL LLEGAR' : 'RETO · MODO CLÁSICO';
      $('#player-status').textContent = nextState.paused ? 'En pausa' : '';
      $('#pause-title').textContent = snapshot.paused.includes('manual') ? 'Continuar partida' : 'Pausar partida';
      if (nextState.motionMessage !== undefined) refs.motion.status.textContent = nextState.motionMessage;
      refs.motion.button.setAttribute('aria-pressed', String(currentPreferences.control === 'motion'));
      refs.motion.button.textContent = nextState.motionState === 'usable' ? 'Movimiento activo ✓' : nextState.motionState === 'waiting' ? 'Esperando movimiento…' : currentPreferences.control === 'motion' ? 'Reintentar movimiento' : 'Usar movimiento';
      const feedback = $('#feedback-toast'); feedback.textContent = nextState.victory || nextState.feedback || '';
      feedback.hidden = !feedback.textContent;
      if (started) { $('#setup-screen').hidden = true; $('#game-screen').hidden = false; }
    },
    dispose() {
      disposed = true;
      if (scheduledFrame) cancelAnimationFrame(scheduledFrame);
      for (const dialog of [settings, restart, help]) if (dialog.open) dialog.close();
      root.innerHTML = ''; root.classList.remove('aritos-player'); delete root.dataset.theme; delete root.dataset.control;
    },
  };
}
