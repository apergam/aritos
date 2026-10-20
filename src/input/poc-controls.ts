import type { PumpSide } from '../physics';
import type { ToyModelId } from '../models/toy-model';
import * as THREE from 'three';
import { calibratedGravity, gravityFromOrientation } from '../physics';

export type PocInputActions = Readonly<{
  model: () => ToyModelId;
  paused: () => boolean;
  pump: (side: PumpSide) => void;
  togglePause: () => void;
  setManualTilt: (roll: number, pitch: number) => void;
}>;
export type PumpElements = Partial<Record<PumpSide, HTMLElement>>;

export const INPUT_SHORTCUTS = Object.freeze([
  { keys: 'A / D', description: 'Bombear lado izquierdo / derecho' },
  { keys: 'Espacio', description: 'Bombear ambos lados' },
  { keys: 'Flechas', description: 'Inclinar de lado y adelante / atrás' },
  { keys: 'W / S', description: 'Inclinar adelante / atrás' },
  { keys: 'P', description: 'Pausar o continuar' },
] as const);
export const INPUT_HELP = 'Toca los botones para bombear. En computadora: A/D bombea, Espacio activa ambos lados y las flechas o W/S inclinan hasta invertir el juguete; P pausa.';

const GAME_KEYS = new Set([' ', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'a', 'd', 'w', 's', 'p']);
function isEditingControl(target: EventTarget | null): boolean {
  if (!target || typeof (target as Element).closest !== 'function') return false;
  return Boolean((target as Element).closest('input, select, textarea, button, a[href], [contenteditable=""], [contenteditable="true"], [role="textbox"]'));
}

/** Owns pump pointer edges, keyboard commands, and held-key manual tilt. */
export class PocControls {
  private keys = new Set<string>();
  private acceptedKeys = new Set<string>();
  private pointers = new Map<number, PumpSide>();
  private cleanup: Array<() => void> = [];
  private originalTouchAction = new Map<HTMLElement, string>();
  private roll = 0;
  private pitch = 0;

  constructor(private readonly actions: PocInputActions, buttons: PumpElements, private readonly target: Window = window) {
    const doc = target.document;
    const buttonActivations: Array<{ release(key: string): void; clear(): void }> = [];
    const down = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (!GAME_KEYS.has(key) || isEditingControl(event.target)) return;
      event.preventDefault();
      if (event.repeat || this.acceptedKeys.has(key)) return;
      this.acceptedKeys.add(key);
      this.keys.add(key);
      if (key === 'p') actions.togglePause();
      if (key === ' ') this.pumpPair();
      if (key === 'a') actions.pump(actions.model() === 'single-button' ? 'center' : 'left');
      if (key === 'd') actions.pump(actions.model() === 'single-button' ? 'center' : 'right');
    };
    const up = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      this.acceptedKeys.delete(key);
      this.keys.delete(key);
      for (const activation of buttonActivations) activation.release(event.key);
    };
    const clearHeld = () => {
      this.keys.clear(); this.acceptedKeys.clear(); this.pointers.clear();
      for (const activation of buttonActivations) activation.clear();
    };
    const visibility = () => { if (doc.hidden) clearHeld(); };
    target.addEventListener('keydown', down);
    target.addEventListener('keyup', up);
    target.addEventListener('blur', clearHeld);
    doc.addEventListener('visibilitychange', visibility);
    this.cleanup.push(
      () => target.removeEventListener('keydown', down),
      () => target.removeEventListener('keyup', up),
      () => target.removeEventListener('blur', clearHeld),
      () => doc.removeEventListener('visibilitychange', visibility),
    );

    const pointerUp = (event: PointerEvent) => { this.pointers.delete(event.pointerId); };
    const pointerCancel = (event: PointerEvent) => { this.pointers.delete(event.pointerId); };
    target.addEventListener('pointerup', pointerUp);
    target.addEventListener('pointercancel', pointerCancel);
    this.cleanup.push(
      () => target.removeEventListener('pointerup', pointerUp),
      () => target.removeEventListener('pointercancel', pointerCancel),
    );
    for (const [side, element] of Object.entries(buttons) as [PumpSide, HTMLElement][]) {
      if (!element) continue;
      this.originalTouchAction.set(element, element.style.touchAction);
      element.style.touchAction = 'none';
      const keyboardKeys = new Set<string>();
      const activation = {
        suppressClick: false,
        release(key: string) {
          if (!keyboardKeys.delete(key)) return;
          queueMicrotask(() => { activation.suppressClick = false; });
        },
        clear() { keyboardKeys.clear(); activation.suppressClick = false; },
      };
      buttonActivations.push(activation);
      const keyDown = (event: KeyboardEvent) => {
        if (event.key !== ' ' && event.key !== 'Enter') return;
        event.preventDefault();
        if (event.repeat || keyboardKeys.has(event.key)) return;
        keyboardKeys.add(event.key);
        actions.pump(side);
        // Ignore a browser-synthesized click for this same key activation.
        activation.suppressClick = true;
      };
      const keyUp = (event: KeyboardEvent) => activation.release(event.key);
      const buttonBlur = () => activation.clear();
      const click = (event: MouseEvent) => {
        // Pointer activation already fired on pointerdown. detail=0 covers assistive
        // technology and programmatic activation that has no pointer event.
        if (event.detail !== 0 || activation.suppressClick) return;
        event.preventDefault();
        actions.pump(side);
      };
      const pointerDown = (event: PointerEvent) => {
        if (event.button !== 0 || this.pointers.has(event.pointerId)) return;
        event.preventDefault();
        this.pointers.set(event.pointerId, side);
        actions.pump(side);
        try { element.setPointerCapture(event.pointerId); } catch { /* Window-level release handlers remain available. */ }
      };
      element.addEventListener('pointerdown', pointerDown);
      element.addEventListener('keydown', keyDown);
      element.addEventListener('keyup', keyUp);
      element.addEventListener('blur', buttonBlur);
      element.addEventListener('click', click);
      this.cleanup.push(
        () => element.removeEventListener('pointerdown', pointerDown),
        () => element.removeEventListener('keydown', keyDown),
        () => element.removeEventListener('keyup', keyUp),
        () => element.removeEventListener('blur', buttonBlur),
        () => element.removeEventListener('click', click),
      );
    }
  }

  update(elapsedSeconds: number): void {
    if (this.actions.paused()) return;
    let changed = false;
    const rate = 90 * Math.max(0, Math.min(elapsedSeconds, 0.1));
    if (this.keys.has('arrowleft')) { this.roll -= rate; changed = true; }
    if (this.keys.has('arrowright')) { this.roll += rate; changed = true; }
    if (this.keys.has('arrowup') || this.keys.has('w')) { this.pitch -= rate; changed = true; }
    if (this.keys.has('arrowdown') || this.keys.has('s')) { this.pitch += rate; changed = true; }
    if (changed) {
      this.roll = Math.max(-180, Math.min(180, this.roll));
      this.pitch = Math.max(-180, Math.min(180, this.pitch));
      this.actions.setManualTilt(this.roll, this.pitch);
    }
  }

  resetTilt(roll = 0, pitch = 0, publish = true): void {
    this.roll = roll; this.pitch = pitch;
    if (publish) this.actions.setManualTilt(roll, pitch);
  }
  /** Synchronize UI-selected angles without changing the active sensor/manual source. */
  syncTilt(roll: number, pitch: number): void { this.roll = roll; this.pitch = pitch; }
  dispose(): void {
    for (const dispose of this.cleanup.splice(0)) dispose();
    for (const [element, value] of this.originalTouchAction) element.style.touchAction = value;
    this.originalTouchAction.clear(); this.keys.clear(); this.acceptedKeys.clear(); this.pointers.clear();
  }
  private pumpPair(): void {
    if (this.actions.model() === 'single-button') this.actions.pump('center');
    else { this.actions.pump('left'); this.actions.pump('right'); }
  }
}

export type MotionControlState = 'manual' | 'unavailable' | 'waiting' | 'usable' | 'denied' | 'unusable-data';
export type MotionControlsOptions = Readonly<{
  button: HTMLElement; status: HTMLElement; rollValue: HTMLInputElement; pitchValue: HTMLInputElement;
  rollLabel: HTMLElement; pitchLabel: HTMLElement; target?: Window; sensorTimeoutMs?: number;
  onGravity?: (gravity: THREE.Vector3) => void;
}>;

const DOWN = new THREE.Vector3(0, -1, 0);
const SENSOR_MESSAGES: Record<MotionControlState, string> = {
  manual: 'Control manual activo. Flechas: de lado · W/S: profundidad.',
  unavailable: 'Sin sensores disponibles. Usa los controles manuales; flechas y W/S permiten inclinar e invertir.',
  waiting: 'Esperando movimiento del dispositivo… Puedes usar los controles manuales.',
  usable: 'Movimiento activo. Centrar ajusta tu postura de referencia.',
  denied: 'Permiso de movimiento denegado. Usa los controles manuales; flechas y W/S permiten inclinar e invertir.',
  'unusable-data': 'Los datos de movimiento no son utilizables. Usa los controles manuales; flechas y W/S permiten inclinar e invertir.',
};

/** Sensor permission, capability state, calibration, manual tilt, and sensor lifecycle. */
export class PocMotionControls {
  readonly gravity = new THREE.Vector3(0, -3, 0);
  private readonly target: Window;
  private raw: THREE.Vector3 | null = null;
  private lastAngles: { beta: number; gamma: number } | null = null;
  private calibration = new THREE.Quaternion();
  private timer: ReturnType<typeof setTimeout> | undefined;
  private listening = false;
  private active = false;
  private stateValue: MotionControlState = 'manual';
  private invalidData = false;
  private consecutiveInvalidEvents = 0;
  private disposed = false;
  private requestGeneration = 0;
  private roll = 0;
  private pitch = 0;

  constructor(private readonly elements: MotionControlsOptions) {
    this.target = elements.target ?? window;
    const C = (this.target as Window & typeof globalThis).DeviceOrientationEvent;
    this.setState(C ? 'manual' : 'unavailable');
    this.target.addEventListener('deviceorientation', this.onOrientation);
    this.target.addEventListener('orientationchange', this.onScreenOrientationChange);
    this.target.screen?.orientation?.addEventListener('change', this.onScreenOrientationChange);
    this.listening = true;
    elements.button.addEventListener('click', this.enable);
  }

  get sensorMode(): boolean { return this.active; }
  get hasSensorData(): boolean { return this.stateValue === 'usable'; }
  get state(): MotionControlState { return this.stateValue; }
  get capabilityMessage(): string { return SENSOR_MESSAGES[this.stateValue]; }

  /** Called from an explicit user click; browsers requiring a gesture keep permission gated here. */
  enable = async (): Promise<void> => {
    if (this.disposed) return;
    const generation = ++this.requestGeneration;
    const C = (this.target as Window & typeof globalThis).DeviceOrientationEvent as (typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> }) | undefined;
    if (!C) { this.active = false; this.setState('unavailable'); return; }
    this.active = false; this.invalidData = false; this.consecutiveInvalidEvents = 0;
    clearTimeout(this.timer); this.timer = undefined; this.setState('waiting');
    try {
      if (C.requestPermission && await C.requestPermission() !== 'granted') {
        if (this.isCurrent(generation)) this.setState('denied');
        return;
      }
      if (!this.isCurrent(generation)) return;
      this.active = true;
      this.armSensorWatchdog(generation);
      if (this.raw) this.calibrateToDown(this.raw);
    } catch {
      if (this.isCurrent(generation)) { this.active = false; this.setState('denied'); }
    }
  };

  center(): void {
    if (this.active && this.raw) {
      this.calibrateToDown(this.raw);
      this.gravity.set(0, -3, 0);
      this.elements.button.textContent = 'Movimiento activo ✓';
      this.elements.onGravity?.(this.gravity.clone());
      this.setState('usable');
    } else this.setManual(0, 0);
  }
  invert(): void { this.setManual(180, 0); }
  setManual(roll: number, pitch: number): void {
    if (this.disposed) return;
    ++this.requestGeneration;
    this.active = false; clearTimeout(this.timer); this.timer = undefined; this.roll = roll; this.pitch = pitch;
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch * Math.PI / 180, 0, roll * Math.PI / 180, 'XYZ'));
    this.gravity.copy(DOWN).multiplyScalar(3).applyQuaternion(q);
    this.elements.rollLabel.textContent = `${Math.round(roll)}°`;
    this.elements.pitchLabel.textContent = `${Math.round(pitch)}°`;
    this.elements.rollValue.value = String(roll); this.elements.pitchValue.value = String(pitch);
    this.elements.button.textContent = 'Usar movimiento';
    this.setState('manual');
    this.elements.onGravity?.(this.gravity.clone());
  }
  dispose(): void {
    this.disposed = true; ++this.requestGeneration;
    if (this.listening) {
      this.target.removeEventListener('deviceorientation', this.onOrientation);
      this.target.removeEventListener('orientationchange', this.onScreenOrientationChange);
      this.target.screen?.orientation?.removeEventListener('change', this.onScreenOrientationChange);
    }
    this.elements.button.removeEventListener('click', this.enable);
    clearTimeout(this.timer); this.timer = undefined; this.listening = false; this.active = false;
  }

  private onOrientation = (event: DeviceOrientationEvent): void => {
    const { beta, gamma } = event;
    if (beta === null || gamma === null || !Number.isFinite(beta) || !Number.isFinite(gamma)) {
      if (this.active) {
        this.invalidData = true;
        this.consecutiveInvalidEvents++;
        if (this.consecutiveInvalidEvents >= 3) {
          this.active = false; clearTimeout(this.timer); this.timer = undefined;
          this.setState('unusable-data');
        } else this.armSensorWatchdog(this.requestGeneration);
      }
      return;
    }
    this.lastAngles = { beta, gamma };
    this.raw = this.rawForScreen(beta, gamma);
    if (!this.active || this.disposed) return;
    this.invalidData = false; this.consecutiveInvalidEvents = 0;
    if (this.stateValue === 'waiting') this.calibrateToDown(this.raw);
    this.gravity.copy(calibratedGravity(this.raw, this.calibration));
    this.elements.button.textContent = 'Movimiento activo ✓';
    this.setState('usable');
    this.armSensorWatchdog(this.requestGeneration);
    this.elements.onGravity?.(this.gravity.clone());
  };
  private onScreenOrientationChange = (): void => {
    if (!this.lastAngles) return;
    const priorGravity = this.gravity.clone().normalize();
    this.raw = this.rawForScreen(this.lastAngles.beta, this.lastAngles.gamma);
    if (this.active && this.stateValue === 'usable') {
      // Rebase the coordinate mapping while preserving current gravity through rotation.
      this.calibration.setFromUnitVectors(this.raw, priorGravity);
      this.gravity.copy(priorGravity).multiplyScalar(3);
      this.elements.onGravity?.(this.gravity.clone());
    }
  };
  private rawForScreen(beta: number, gamma: number): THREE.Vector3 {
    const angle = this.target.screen?.orientation?.angle ?? Number((this.target as Window & { orientation?: number }).orientation ?? 0);
    return gravityFromOrientation(beta, gamma, angle);
  }
  private calibrateToDown(raw: THREE.Vector3): void { this.calibration.setFromUnitVectors(raw, DOWN); }
  private armSensorWatchdog(generation: number): void {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = undefined;
      if (!this.isCurrent(generation) || !this.active) return;
      this.active = false;
      this.setState(this.invalidData ? 'unusable-data' : 'unavailable');
    }, this.elements.sensorTimeoutMs ?? 3000);
  }
  private setState(state: MotionControlState): void {
    this.stateValue = state;
    this.elements.status.textContent = SENSOR_MESSAGES[state];
    if (state !== 'usable') this.elements.button.textContent = state === 'waiting' ? 'Esperando movimiento…' : 'Usar movimiento';
  }
  private isCurrent(generation: number): boolean { return !this.disposed && generation === this.requestGeneration; }
}
