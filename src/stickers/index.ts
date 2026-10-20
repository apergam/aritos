import type { GameEvent } from '../game/session';
import type { ThemeId } from '../themes';

export type StickerDefinition = Readonly<{ id: string; label: string; src: string; alt?: string; theme: ThemeId }>;
export type StickerSurface = Readonly<{ left: number; top: number; width: number; height: number }>;
export type StickerPlacement = Readonly<{ id: string; x: number; y: number }>;
export type StickerData = Readonly<{ unlocked: readonly string[]; placements: readonly StickerPlacement[] }>;
export type StickerFeatureOptions = Readonly<{
  catalog: readonly StickerDefinition[];
  getSurface: () => StickerSurface;
  onEditingChange: (editing: boolean) => void;
  storage?: Pick<Storage, 'getItem' | 'setItem'>;
  /** False creates an isolated sandbox that neither reads nor writes the normal save. */
  eligible?: boolean;
}>;
export type StickerFeature = Readonly<{
  setRound(roundId: number, theme: ThemeId): void;
  handle(event: GameEvent): void;
  open(): void;
  close(): void;
  refresh(): void;
  dispose(): void;
}>;

export const STICKER_STORAGE_KEY = 'aritos.stickers.v1';
export const DEFAULT_STICKERS: readonly StickerDefinition[] = Object.freeze([
  Object.freeze({ id: 'ocean-octopus', label: 'Pulpo', alt: 'Sticker de pulpo', src: './assets/stickers/ocean-octopus-3ee08e881c.png', theme: 'ocean' }),
  Object.freeze({ id: 'space-rocket', label: 'Cohete', alt: 'Sticker de cohete', src: './assets/stickers/space-rocket-e7184c9a22.png', theme: 'space' }),
  Object.freeze({ id: 'capybara-capy', label: 'Capibara', alt: 'Sticker de capibara', src: './assets/stickers/capybara-capy-d01bdb98ab.png', theme: 'capybaras' }),
]);

const isFiniteUnit = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1;
const cleanData = (value: unknown, allowed: ReadonlySet<string>): StickerData => {
  if (!value || typeof value !== 'object') return { unlocked: [], placements: [] };
  const raw = value as { unlocked?: unknown; placements?: unknown };
  const unlocked = Array.isArray(raw.unlocked) ? [...new Set(raw.unlocked.filter((id): id is string => typeof id === 'string' && allowed.has(id)))] : [];
  const placements: StickerPlacement[] = [];
  if (Array.isArray(raw.placements)) {
    for (const item of raw.placements) {
      if (!item || typeof item !== 'object') continue;
      const p = item as { id?: unknown; x?: unknown; y?: unknown };
      if (typeof p.id !== 'string' || !unlocked.includes(p.id) || !isFiniteUnit(p.x) || !isFiniteUnit(p.y) || placements.some(existing => existing.id === p.id)) continue;
      if (placements.length < 3) placements.push({ id: p.id, x: p.x, y: p.y });
    }
  }
  return { unlocked, placements };
};

export function parseStickerData(serialized: string | null, catalog: readonly StickerDefinition[]): StickerData {
  try {
    if (!serialized) return { unlocked: [], placements: [] };
    const parsed = JSON.parse(serialized) as { version?: unknown; data?: unknown };
    if (parsed?.version !== 1) return { unlocked: [], placements: [] };
    return cleanData(parsed.data, new Set(catalog.map(item => item.id)));
  } catch { return { unlocked: [], placements: [] }; }
}

export function normalizeStickerPoint(point: { x: number; y: number }, width: number, height: number, insetX = 0.06, insetY = 0.06): { x: number; y: number } | null {
  if (![point.x, point.y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return null;
  const xInset = Math.max(0, Math.min(0.49, Number.isFinite(insetX) ? insetX : 0.06));
  const yInset = Math.max(0, Math.min(0.49, Number.isFinite(insetY) ? insetY : 0.06));
  return { x: Math.max(xInset, Math.min(1 - xInset, point.x / width)), y: Math.max(yInset, Math.min(1 - yInset, point.y / height)) };
}

export function clampStickerPlacementToSurface(placement: StickerPlacement, width: number, height: number): StickerPlacement {
  if (![placement.x, placement.y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return placement;
  const stickerSize = Math.min(54, Math.max(22, width * 0.14));
  const point = normalizeStickerPoint({ x: placement.x * width, y: placement.y * height }, width, height, stickerSize / (2 * width) + 0.01, stickerSize / (2 * height) + 0.01);
  return point ? { ...placement, ...point } : placement;
}

export function unlockThemeSticker(data: StickerData, theme: ThemeId, catalog: readonly StickerDefinition[]): StickerData {
  const reward = catalog.find(item => item.theme === theme && !data.unlocked.includes(item.id));
  return reward ? { ...data, unlocked: [...data.unlocked, reward.id] } : data;
}

export function processStickerVictory(data: StickerData, currentRoundId: number, awardedRoundId: number | null, eventRoundId: number, theme: ThemeId, catalog: readonly StickerDefinition[]): { data: StickerData; awardedRoundId: number | null; reward: StickerDefinition | null } {
  if (eventRoundId !== currentRoundId || awardedRoundId === eventRoundId) return { data, awardedRoundId, reward: null };
  const reward = catalog.find(item => item.theme === theme && !data.unlocked.includes(item.id)) ?? null;
  return { data: reward ? { ...data, unlocked: [...data.unlocked, reward.id] } : data, awardedRoundId: eventRoundId, reward };
}

export function createStickerFeature(host: HTMLElement, options: StickerFeatureOptions): StickerFeature {
  const catalog = options.catalog.filter((item, index, all) => item.id && all.findIndex(other => other.id === item.id) === index);
  const byId = new Map(catalog.map(item => [item.id, item]));
  const sandbox = options.eligible === false;
  let data = sandbox ? { unlocked: [] as string[], placements: [] as StickerPlacement[] } : parseStickerData(safeRead(options.storage), catalog);
  let roundId = -1;
  let currentTheme: ThemeId = 'ocean';
  let awardedRoundId: number | null = null;
  let editing = false;
  let pendingId: string | null = null;
  let selectedId: string | null = null;
  let disposed = false;
  let dragCleanup: (() => void) | null = null;
  let opener: HTMLElement | null = null;
  let toastTimer = 0;
  let headingFocusFrame = 0;

  const overlay = document.createElement('div');
  overlay.className = 'sticker-overlay';
  overlay.setAttribute('aria-label', 'Decoraciones del juguete');
  overlay.setAttribute('aria-live', 'off');
  const panel = document.createElement('section');
  panel.className = 'sticker-panel';
  panel.setAttribute('aria-label', 'Colección de stickers');
  panel.hidden = true;
  const heading = document.createElement('h2');
  heading.textContent = 'Stickers'; heading.tabIndex = -1;
  const rewardStatus = document.createElement('p');
  rewardStatus.className = 'sticker-reward'; rewardStatus.setAttribute('role', 'status'); rewardStatus.setAttribute('aria-live', 'polite'); rewardStatus.hidden = true;
  const note = document.createElement('p');
  note.className = 'sticker-sandbox-note'; note.textContent = 'Modo de prueba: los stickers no se guardan.'; note.hidden = !sandbox;
  const list = document.createElement('div'); list.className = 'sticker-list';
  const help = document.createElement('details'); help.className = 'sticker-help';
  const helpSummary = document.createElement('summary'); helpSummary.textContent = 'Ayuda';
  const hint = document.createElement('p'); hint.className = 'sticker-hint'; hint.tabIndex = -1; hint.setAttribute('aria-live', 'polite');
  help.append(helpSummary, hint);
  const removeButton = document.createElement('button'); removeButton.type = 'button'; removeButton.textContent = 'Quitar';
  const closeButton = document.createElement('button'); closeButton.type = 'button'; closeButton.textContent = 'Terminar';
  const footer = document.createElement('div'); footer.className = 'sticker-footer';
  footer.append(removeButton, closeButton);
  panel.append(heading, rewardStatus, note, list, help, footer);
  const toast = document.createElement('div');
  toast.className = 'sticker-toast'; toast.setAttribute('role', 'status'); toast.setAttribute('aria-live', 'polite'); toast.hidden = true;
  document.body.append(panel);
  document.body.append(toast);
  host.append(overlay);

  const previews = new Map<string, HTMLImageElement>();
  const rows = new Map<string, { row: HTMLDivElement; status: HTMLSpanElement; preview: HTMLImageElement; action: HTMLButtonElement }>();
  const buttons = new Map<string, HTMLButtonElement>();
  for (const item of catalog) {
    const row = document.createElement('div'); row.className = 'sticker-row';
    const preview = document.createElement('img'); preview.className = 'sticker-thumb'; preview.alt = '';
    if (item.src) { preview.decoding = 'async'; preview.src = item.src; }
    previews.set(item.id, preview);
    const status = document.createElement('span');
    const action = document.createElement('button'); action.type = 'button';
    row.append(preview, status, action); list.append(row);
    rows.set(item.id, { row, status, preview, action });
  }

  const persist = () => {
    if (sandbox) return;
    try { getStorage(options.storage)?.setItem(STICKER_STORAGE_KEY, JSON.stringify({ version: 1, data })); } catch { /* Storage is optional. */ }
  };
  const notify = (value: boolean) => { if (editing !== value) { editing = value; host.classList.toggle('sticker-feature-editing', value); options.onEditingChange(value); } };
  const updateOverlay = () => {
    if (disposed) return;
    const surface = options.getSurface();
    // Surface coordinates are relative to the renderer host, matching getSurface's contract.
    const sx = surface.left, sy = surface.top;
    if (surface.width > 0 && surface.height > 0) {
      overlay.style.left = `${sx}px`; overlay.style.top = `${sy}px`;
      overlay.style.width = `${surface.width}px`; overlay.style.height = `${surface.height}px`;
      overlay.hidden = false;
      let didClamp = false;
      const clampedPlacements = data.placements.map(placement => {
        const next = clampStickerPlacementToSurface(placement, surface.width, surface.height);
        if (Math.abs(next.x - placement.x) < 1e-6 && Math.abs(next.y - placement.y) < 1e-6) return placement;
        didClamp = true;
        return next;
      });
      if (didClamp) { data = { ...data, placements: clampedPlacements }; persist(); }
      const present = new Set(data.placements.map(p => p.id));
      for (const [id, button] of buttons) if (!present.has(id)) {
        const preview = previews.get(id), row = rows.get(id)?.row;
        if (preview && row) row.prepend(preview);
        button.remove(); buttons.delete(id);
      }
      for (const placement of data.placements) {
        const sticker = byId.get(placement.id); if (!sticker) continue;
        const button = ensureStickerButton(sticker);
        const stickerSize = Math.min(54, Math.max(22, surface.width * 0.14));
        button.style.width = `${stickerSize}px`; button.style.height = `${stickerSize}px`;
        button.style.left = `${placement.x * 100}%`; button.style.top = `${placement.y * 100}%`;
        button.classList.toggle('selected', editing && selectedId === sticker.id);
        button.tabIndex = editing ? 0 : -1;
      }
      overlay.onpointerdown = event => {
        if (!editing || !pendingId || (event.target as HTMLElement).closest('.sticker')) return;
        const r = overlay.getBoundingClientRect();
        setPlacement(pendingId, event.clientX - r.left, event.clientY - r.top, r.width, r.height);
        pendingId = null; updatePanel();
      };
    } else overlay.hidden = true;
  };
  const updatePanel = () => {
    if (disposed) return;
    for (const item of catalog) {
      const row = rows.get(item.id)!;
      const unlocked = data.unlocked.includes(item.id);
      const placed = data.placements.some(p => p.id === item.id);
      row.status.textContent = unlocked ? `Desbloqueado: ${item.label}` : `${themeLabel(item.theme)}: gana una ronda`;
      row.action.hidden = !unlocked;
      row.action.textContent = placed ? 'Mover' : 'Colocar';
      row.action.disabled = !unlocked || (data.placements.length >= 3 && !placed);
      row.action.setAttribute('aria-label', `${placed ? 'Mover' : 'Colocar'} sticker: ${item.label}`);
    }
    hint.textContent = pendingId ? 'Toca el frente del juguete para colocarlo. Con teclado, usa flechas y Enter.' : 'Selecciona un sticker y muévelo con las flechas; Supr lo quita.';
    removeButton.disabled = !selectedId || !data.placements.some(p => p.id === selectedId);
    removeButton.setAttribute('aria-label', selectedId ? `Quitar sticker ${byId.get(selectedId)?.label ?? ''}` : 'Quitar sticker seleccionado');
  };
  const setPlacement = (id: string, x: number, y: number, width: number, height: number) => {
    const stickerSize = Math.min(54, Math.max(22, width * 0.14));
    const point = normalizeStickerPoint({ x, y }, width, height, stickerSize / (2 * width) + 0.01, stickerSize / (2 * height) + 0.01); if (!point) return;
    const old = data.placements.filter(item => item.id !== id);
    if (old.length >= 3 && !data.placements.some(item => item.id === id)) return;
    data = { ...data, placements: [...old, { id, ...point }] }; selectedId = id; persist();
    updateOverlay(); updatePanel();
  };
  const ensureStickerButton = (sticker: StickerDefinition) => {
    const existing = buttons.get(sticker.id); if (existing) return existing;
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'sticker placed';
    button.setAttribute('aria-label', `${sticker.label}. Seleccionar para mover o quitar`);
    const image = previews.get(sticker.id)!; image.alt = sticker.alt ?? sticker.label; image.draggable = false;
    button.append(image);
    button.addEventListener('pointerdown', event => {
      if (!editing) return;
      event.preventDefault();
      selectedId = sticker.id; pendingId = null; button.focus(); updateOverlay(); updatePanel();
      try { button.setPointerCapture(event.pointerId); } catch { /* A pointer may already have been canceled. */ }
      const pointerId = event.pointerId;
      const stickerRect = button.getBoundingClientRect();
      const pointerOffsetX = event.clientX - (stickerRect.left + stickerRect.width / 2);
      const pointerOffsetY = event.clientY - (stickerRect.top + stickerRect.height / 2);
      const move = (e: PointerEvent) => {
        if (e.pointerId !== pointerId) return;
        const r = overlay.getBoundingClientRect();
        const placement = data.placements.find(p => p.id === sticker.id);
        if (!placement) return;
        setPlacement(sticker.id, e.clientX - r.left - pointerOffsetX, e.clientY - r.top - pointerOffsetY, r.width, r.height);
      };
      const end = (e: PointerEvent) => {
        if (e.pointerId !== pointerId) return;
        cleanup();
      };
      const cleanup = () => {
        window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', end);
        try { if (button.hasPointerCapture(pointerId)) button.releasePointerCapture(pointerId); } catch { /* Capture may already be gone. */ }
        if (dragCleanup === cleanup) dragCleanup = null;
      };
      dragCleanup?.(); dragCleanup = cleanup;
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
    });
    button.addEventListener('click', () => { if (!editing) return; selectedId = sticker.id; pendingId = null; updateOverlay(); updatePanel(); });
    buttons.set(sticker.id, button); overlay.append(button); return button;
  };
  const removeSelected = () => {
    if (!selectedId) return;
    const removedId = selectedId;
    data = { ...data, placements: data.placements.filter(item => item.id !== removedId) };
    selectedId = null; persist(); updateOverlay(); updatePanel();
    panel.querySelector<HTMLElement>('.sticker-action')?.focus();
  };
  removeButton.addEventListener('click', removeSelected);
  closeButton.addEventListener('click', () => api.close());
  for (const item of catalog) {
    const row = rows.get(item.id)!;
    row.action.classList.add('sticker-action');
    row.action.addEventListener('click', () => {
      help.open = true;
      if (data.placements.some(p => p.id === item.id)) {
        pendingId = null; selectedId = item.id; updateOverlay(); updatePanel();
      } else {
        pendingId = item.id; selectedId = item.id; updatePanel();
      }
      hint.focus();
    });
  }
  const keydown = (event: KeyboardEvent) => {
    if (!editing) return;
    const key = event.key.toLowerCase();
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); api.close(); return; }
    if (pendingId && event.key === 'Enter') {
      event.preventDefault(); event.stopImmediatePropagation(); setPlacement(pendingId, overlay.clientWidth / 2, overlay.clientHeight / 2, overlay.clientWidth, overlay.clientHeight); pendingId = null; updatePanel(); return;
    }
    if (pendingId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault(); event.stopImmediatePropagation();
      const delta = event.shiftKey ? 0.05 : 0.015;
      const x = overlay.clientWidth * (0.5 + (event.key === 'ArrowRight' ? delta : event.key === 'ArrowLeft' ? -delta : 0));
      const y = overlay.clientHeight * (0.5 + (event.key === 'ArrowDown' ? delta : event.key === 'ArrowUp' ? -delta : 0));
      setPlacement(pendingId, x, y, overlay.clientWidth, overlay.clientHeight); pendingId = null; updatePanel(); return;
    }
    if (selectedId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Delete', 'Backspace'].includes(event.key)) {
      if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); event.stopImmediatePropagation(); removeSelected(); return; }
      event.preventDefault(); event.stopImmediatePropagation();
      const delta = event.shiftKey ? 0.05 : 0.015;
      const p = data.placements.find(item => item.id === selectedId); if (!p) return;
      setPlacement(selectedId, (p.x + (event.key === 'ArrowRight' ? delta : event.key === 'ArrowLeft' ? -delta : 0)) * overlay.clientWidth, (p.y + (event.key === 'ArrowDown' ? delta : event.key === 'ArrowUp' ? -delta : 0)) * overlay.clientHeight, overlay.clientWidth, overlay.clientHeight);
      return;
    }
    // Prevent the game's window-level shortcuts from consuming editor keys.
    if ([' ', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'a', 'd', 'w', 's', 'p'].includes(key)) {
      const nativeButton = event.key === ' ' && event.target instanceof Element && event.target.closest('button, a[href]');
      if (!nativeButton) { event.preventDefault(); event.stopImmediatePropagation(); }
    }
  };
  window.addEventListener('keydown', keydown, true);
  const resize = () => updateOverlay(); window.addEventListener('resize', resize);
  function open() {
    if (disposed || editing) return;
    opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    pendingId = null; help.open = false; panel.hidden = false; updatePanel(); notify(true); updateOverlay();
    window.cancelAnimationFrame(headingFocusFrame);
    headingFocusFrame = window.requestAnimationFrame(() => { if (editing && !panel.hidden && heading.isConnected) heading.focus(); });
  }
  function close() {
    if (!editing && panel.hidden) return;
    window.cancelAnimationFrame(headingFocusFrame); headingFocusFrame = 0;
    dragCleanup?.(); dragCleanup = null; pendingId = null; panel.hidden = true; notify(false); updateOverlay();
    const returnFocus = opener; opener = null;
    if (returnFocus?.isConnected) {
      const dialog = returnFocus.closest('dialog') as HTMLDialogElement | null;
      const target = dialog && !dialog.open ? document.querySelector<HTMLElement>('#settings-open') : returnFocus;
      if (target?.isConnected) target.focus();
    }
  }
  const api: StickerFeature = {
    setRound(id, theme) { roundId = id; currentTheme = theme; updateOverlay(); updatePanel(); },
    handle(event) {
      if (disposed || event.type !== 'victory') return;
      const result = processStickerVictory(data, roundId, awardedRoundId, event.roundId, currentTheme, catalog);
      awardedRoundId = result.awardedRoundId;
      if (!result.reward) return;
      data = result.data; persist(); updatePanel(); updateOverlay();
      const rewardName = result.reward.label;
      toast.textContent = `¡Ganaste el sticker ${rewardName}!`; toast.hidden = false;
      rewardStatus.textContent = toast.textContent; rewardStatus.hidden = false;
      window.clearTimeout(toastTimer); toastTimer = window.setTimeout(() => { toast.hidden = true; }, 4200);
    },
    open, close, refresh() { updateOverlay(); updatePanel(); },
    dispose() { if (disposed) return; close(); window.cancelAnimationFrame(headingFocusFrame); dragCleanup?.(); dragCleanup = null; disposed = true; window.clearTimeout(toastTimer); toast.remove(); window.removeEventListener('keydown', keydown, true); window.removeEventListener('resize', resize); overlay.remove(); panel.remove(); },
  };
  updatePanel(); updateOverlay();
  return api;
}

function safeRead(storage?: Pick<Storage, 'getItem' | 'setItem'>): string | null { try { return getStorage(storage)?.getItem(STICKER_STORAGE_KEY) ?? null; } catch { return null; } }
function getStorage(storage?: Pick<Storage, 'getItem' | 'setItem'>): Pick<Storage, 'getItem' | 'setItem'> | undefined { try { return storage ?? window.localStorage; } catch { return undefined; } }
function themeLabel(theme: ThemeId): string { return theme === 'ocean' ? 'Océano' : theme === 'space' ? 'Espacio' : 'Capibaras'; }
