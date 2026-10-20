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

/** Owns POC keyboard/pointer listeners and held-key tilt; permission UI stays with the app shell. */
export class PocControls {
  private keys = new Set<string>();
  private cleanup: Array<() => void> = [];
  private roll = 0;
  private pitch = 0;
  constructor(private readonly actions: PocInputActions, buttons: PumpElements, private readonly target: Window = window) {
    const doc = target.document;
    const down = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement | null)?.matches?.('input,select,textarea')) return;
      const key = event.key.toLowerCase();
      if ([' ', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'a', 'd', 'w', 's', 'p'].includes(key)) event.preventDefault();
      if (event.repeat) return;
      this.keys.add(key);
      if (key === 'p') actions.togglePause();
      if (key === ' ') this.pumpPair();
      if (key === 'a') actions.pump(actions.model() === 'single-button' ? 'center' : 'left');
      if (key === 'd') actions.pump(actions.model() === 'single-button' ? 'center' : 'right');
    };
    const up = (event: KeyboardEvent) => this.keys.delete(event.key.toLowerCase());
    const blur = () => this.keys.clear();
    target.addEventListener('keydown', down); target.addEventListener('keyup', up); target.addEventListener('blur', blur);
    this.cleanup.push(() => target.removeEventListener('keydown', down), () => target.removeEventListener('keyup', up), () => target.removeEventListener('blur', blur));
    for (const [side, element] of Object.entries(buttons) as [PumpSide, HTMLElement][]) {
      if (!element) continue;
      const handler = (event: PointerEvent) => { event.preventDefault(); actions.pump(side); };
      element.addEventListener('pointerdown', handler);
      this.cleanup.push(() => element.removeEventListener('pointerdown', handler));
    }
    const visibility = () => { if (doc.hidden) this.keys.clear(); };
    doc.addEventListener('visibilitychange', visibility); this.cleanup.push(() => doc.removeEventListener('visibilitychange', visibility));
  }
  update(elapsedSeconds: number): void {
    if (this.actions.paused()) return;
    let changed = false; const rate = 90 * elapsedSeconds;
    if (this.keys.has('arrowleft')) { this.roll -= rate; changed = true; }
    if (this.keys.has('arrowright')) { this.roll += rate; changed = true; }
    if (this.keys.has('arrowup') || this.keys.has('w')) { this.pitch -= rate; changed = true; }
    if (this.keys.has('arrowdown') || this.keys.has('s')) { this.pitch += rate; changed = true; }
    if (changed) { this.roll = Math.max(-180, Math.min(180, this.roll)); this.pitch = Math.max(-180, Math.min(180, this.pitch)); this.actions.setManualTilt(this.roll, this.pitch); }
  }
  resetTilt(roll = 0, pitch = 0, publish = true): void { this.roll = roll; this.pitch = pitch; if (publish) this.actions.setManualTilt(roll, pitch); }
  /** Synchronize UI-selected angles without changing the active sensor/manual source. */
  syncTilt(roll: number, pitch: number): void { this.roll = roll; this.pitch = pitch; }
  dispose(): void { for (const dispose of this.cleanup.splice(0)) dispose(); this.keys.clear(); }
  private pumpPair(): void { if (this.actions.model() === 'single-button') this.actions.pump('center'); else { this.actions.pump('left'); this.actions.pump('right'); } }
}

export type MotionControlsOptions = Readonly<{ button: HTMLElement; status: HTMLElement; rollValue: HTMLInputElement; pitchValue: HTMLInputElement; rollLabel: HTMLElement; pitchLabel: HTMLElement; target?: Window }>;

/** Owns the POC sensor permission flow, reference calibration, manual tilt, and sensor cleanup. */
export class PocMotionControls {
  readonly gravity = new THREE.Vector3(0, -3, 0);
  private readonly target: Window;
  private raw: THREE.Vector3 | null = null;
  private calibration = new THREE.Quaternion();
  private timer: ReturnType<typeof setTimeout> | undefined;
  private listening = false;
  private active = false;
  private hasSensor = false;
  private roll = 0;
  private pitch = 0;
  constructor(private readonly elements: MotionControlsOptions) {
    this.target = elements.target ?? window;
    this.target.addEventListener('deviceorientation', this.onOrientation);
    this.listening = true;
    elements.button.addEventListener('click', this.enable);
  }
  get sensorMode(): boolean { return this.active; }
  get hasSensorData(): boolean { return this.hasSensor; }
  enable = async (): Promise<void> => {
    const C = (this.target as Window & typeof globalThis).DeviceOrientationEvent as typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> };
    try {
      if (!C) { this.elements.status.textContent = 'Sin sensores disponibles. Usa los controles manuales.'; return; }
      if (C.requestPermission && await C.requestPermission() !== 'granted') { this.elements.status.textContent = 'Permiso no autorizado. Puedes seguir con los controles manuales.'; return; }
      this.active = true; this.hasSensor = false; this.elements.status.textContent = 'Esperando movimiento del dispositivo…';
      if (this.raw) this.calibration.setFromUnitVectors(this.raw, new THREE.Vector3(0, -1, 0));
      clearTimeout(this.timer);
      this.timer = setTimeout(() => { if (!this.hasSensor) { this.active = false; this.elements.status.textContent = 'No llegaron datos de movimiento. El control manual sigue disponible.'; } }, 3000);
    } catch { this.elements.status.textContent = 'No fue posible activar movimiento. Usa los controles manuales.'; this.active = false; }
  };
  center(): void {
    if (this.active && this.raw) { this.calibration.setFromUnitVectors(this.raw, new THREE.Vector3(0, -1, 0)); this.gravity.set(0, -3, 0); }
    else this.setManual(0, 0);
  }
  invert(): void { this.setManual(180, 0); }
  setManual(roll: number, pitch: number): void {
    this.active = false; this.roll = roll; this.pitch = pitch;
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch * Math.PI / 180, 0, roll * Math.PI / 180, 'XYZ'));
    this.gravity.set(0, -3, 0).applyQuaternion(q);
    this.elements.rollLabel.textContent = `${Math.round(roll)}°`; this.elements.pitchLabel.textContent = `${Math.round(pitch)}°`;
    this.elements.rollValue.value = String(roll); this.elements.pitchValue.value = String(pitch);
    this.elements.button.textContent = 'Usar movimiento';
    this.elements.status.textContent = 'Control manual activo. Flechas: de lado · W/S: profundidad.';
  }
  dispose(): void {
    if (this.listening) this.target.removeEventListener('deviceorientation', this.onOrientation);
    this.elements.button.removeEventListener('click', this.enable);
    clearTimeout(this.timer); this.listening = false;
  }
  private onOrientation = (event: DeviceOrientationEvent): void => {
    if (event.beta === null || event.gamma === null || !Number.isFinite(event.beta + event.gamma)) return;
    const angle = this.target.screen.orientation?.angle ?? Number((this.target as Window & { orientation?: number }).orientation ?? 0);
    this.raw = gravityFromOrientation(event.beta, event.gamma, angle);
    if (!this.active) return;
    if (!this.hasSensor) { this.calibration.setFromUnitVectors(this.raw, new THREE.Vector3(0, -1, 0)); this.hasSensor = true; }
    clearTimeout(this.timer);
    this.elements.status.textContent = 'Movimiento activo. Centrar ajusta tu postura de referencia.';
    this.elements.button.textContent = 'Movimiento activo ✓';
    this.gravity.copy(calibratedGravity(this.raw, this.calibration));
  };
}
