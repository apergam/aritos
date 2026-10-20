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

export function normalizeStickerPoint(point: { x: number; y: number }, width: number, height: number): { x: number; y: number } | null {
  if (![point.x, point.y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return null;
  return { x: Math.max(0.06, Math.min(0.94, point.x / width)), y: Math.max(0.06, Math.min(0.94, point.y / height)) };
}

export function unlockThemeSticker(data: StickerData, theme: ThemeId, catalog: readonly StickerDefinition[]): StickerData {
  const reward = catalog.find(item => item.theme === theme && !data.unlocked.includes(item.id));
  return reward ? { ...data, unlocked: [...data.unlocked, reward.id] } : data;
}

export function createStickerFeature(host: HTMLElement, options: StickerFeatureOptions): StickerFeature {
  const catalog = options.catalog.filter((item, index, all) => item.id && all.findIndex(other => other.id === item.id) === index);
  const byId = new Map(catalog.map(item => [item.id, item]));
  const sandbox = options.eligible === false;
  let data = sandbox ? { unlocked: [] as string[], placements: [] as StickerPlacement[] } : parseStickerData(safeRead(options.storage), catalog);
  let roundId = -1;
  let currentTheme: ThemeId = 'ocean';
  const awarded = new Set<number>();
  let editing = false;
  let pendingId: string | null = null;
  let selectedId: string | null = null;
  let disposed = false;
  let dragCleanup: (() => void) | null = null;

  const overlay = document.createElement('div');
  overlay.className = 'sticker-overlay';
  overlay.setAttribute('aria-label', 'Decoraciones del juguete');
  const panel = document.createElement('section');
  panel.className = 'sticker-panel';
  panel.setAttribute('aria-label', 'Colección de stickers');
  panel.hidden = true;
  document.body.append(panel);
  host.append(overlay);

  const persist = () => {
    if (sandbox) return;
    try { getStorage(options.storage)?.setItem(STICKER_STORAGE_KEY, JSON.stringify({ version: 1, data })); } catch { /* Storage is optional. */ }
  };
  const notify = (value: boolean) => { if (editing !== value) { editing = value; host.classList.toggle('sticker-feature-editing', value); options.onEditingChange(value); } };
  const draw = () => {
    if (disposed) return;
    overlay.replaceChildren();
    const surface = options.getSurface();
    // Surface coordinates are relative to the renderer host, matching getSurface's contract.
    const sx = surface.left, sy = surface.top;
    if (surface.width > 0 && surface.height > 0) {
      overlay.style.left = `${sx}px`; overlay.style.top = `${sy}px`;
      overlay.style.width = `${surface.width}px`; overlay.style.height = `${surface.height}px`;
      overlay.hidden = false;
      for (const placement of data.placements) {
        const sticker = byId.get(placement.id); if (!sticker) continue;
        const button = document.createElement('button');
        button.type = 'button'; button.className = `sticker placed${selectedId === sticker.id ? ' selected' : ''}`;
        button.style.left = `${placement.x * 100}%`; button.style.top = `${placement.y * 100}%`;
        button.setAttribute('aria-label', `${sticker.label}. Seleccionar para mover o quitar`);
        button.tabIndex = editing ? 0 : -1;
        const image = document.createElement('img'); image.src = sticker.src; image.alt = sticker.alt ?? sticker.label; image.draggable = false;
        button.append(image);
        if (editing) {
          button.addEventListener('pointerdown', event => {
            event.preventDefault(); button.setPointerCapture(event.pointerId); selectedId = sticker.id;
            const pointerId = event.pointerId;
            const move = (e: PointerEvent) => { if (e.pointerId !== pointerId) return; const r = overlay.getBoundingClientRect(); place(sticker.id, e.clientX - r.left, e.clientY - r.top, r.width, r.height); };
            const end = (e: PointerEvent) => {
              if (e.pointerId !== pointerId) return;
              window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', end);
              if (dragCleanup === cleanup) dragCleanup = null;
            };
            const cleanup = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', end); };
            dragCleanup?.(); dragCleanup = cleanup;
            window.addEventListener('pointermove', move); window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
          });
          button.addEventListener('click', () => { selectedId = sticker.id; draw(); });
        }
        overlay.append(button);
      }
      overlay.onpointerdown = event => {
        if (!editing || !pendingId || (event.target as HTMLElement).closest('.sticker')) return;
        const r = overlay.getBoundingClientRect(); place(pendingId, event.clientX - r.left, event.clientY - r.top, r.width, r.height); pendingId = null; draw();
      };
    } else overlay.hidden = true;
    renderPanel();
  };
  const place = (id: string, x: number, y: number, width: number, height: number) => {
    const point = normalizeStickerPoint({ x, y }, width, height); if (!point) return;
    const old = data.placements.filter(item => item.id !== id);
    if (old.length >= 3 && !data.placements.some(item => item.id === id)) return;
    data = { ...data, placements: [...old, { id, ...point }] }; selectedId = id; persist(); draw();
  };
  const removeSelected = () => { if (!selectedId) return; data = { ...data, placements: data.placements.filter(item => item.id !== selectedId) }; selectedId = null; persist(); draw(); };
  const renderPanel = () => {
    panel.replaceChildren();
    const heading = document.createElement('h2'); heading.textContent = 'Stickers'; panel.append(heading);
    if (sandbox) { const note = document.createElement('p'); note.className = 'sticker-sandbox-note'; note.textContent = 'Modo de prueba: los stickers no se guardan.'; panel.append(note); }
    for (const item of catalog) {
      const row = document.createElement('div'); row.className = 'sticker-row';
      const status = document.createElement('span'); status.textContent = data.unlocked.includes(item.id) ? `Desbloqueado: ${item.label}` : `${themeLabel(item.theme)}: gana una ronda para desbloquear`; row.append(status);
      if (data.unlocked.includes(item.id)) {
        const add = document.createElement('button'); add.type = 'button'; add.textContent = data.placements.some(p => p.id === item.id) ? 'Mover' : 'Colocar'; add.disabled = data.placements.length >= 3 && !data.placements.some(p => p.id === item.id);
        add.addEventListener('click', () => { pendingId = item.id; selectedId = item.id; panel.querySelector<HTMLElement>('.sticker-hint')?.focus(); }); row.append(add);
      }
      panel.append(row);
    }
    const hint = document.createElement('p'); hint.className = 'sticker-hint'; hint.tabIndex = -1; hint.textContent = pendingId ? 'Toca el frente del juguete para colocar. También puedes usar las flechas.' : 'Selecciona un sticker colocado para moverlo con las flechas o quitarlo.'; panel.append(hint);
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Quitar seleccionado'; remove.disabled = !selectedId; remove.addEventListener('click', removeSelected); panel.append(remove);
    const close = document.createElement('button'); close.type = 'button'; close.textContent = 'Terminar'; close.addEventListener('click', () => api.close()); panel.append(close);
  };
  const keydown = (event: KeyboardEvent) => {
    if (!editing || !selectedId || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Delete', 'Backspace'].includes(event.key)) return;
    if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); removeSelected(); return; }
    event.preventDefault();
    const delta = event.shiftKey ? 0.05 : 0.015;
    const p = data.placements.find(item => item.id === selectedId); if (!p) return;
    place(selectedId, (p.x + (event.key === 'ArrowRight' ? delta : event.key === 'ArrowLeft' ? -delta : 0)) * overlay.clientWidth, (p.y + (event.key === 'ArrowDown' ? delta : event.key === 'ArrowUp' ? -delta : 0)) * overlay.clientHeight, overlay.clientWidth, overlay.clientHeight);
  };
  window.addEventListener('keydown', keydown);
  const resize = () => draw(); window.addEventListener('resize', resize);
  function open() { panel.hidden = false; pendingId = null; notify(true); draw(); }
  function close() { panel.hidden = true; pendingId = null; notify(false); draw(); }
  const api: StickerFeature = {
    setRound(id, theme) { roundId = id; currentTheme = theme; awarded.clear(); draw(); },
    handle(event) {
      if (event.type !== 'victory' || event.roundId !== roundId || awarded.has(event.roundId)) return;
      awarded.add(event.roundId);
      const next = unlockThemeSticker(data, currentTheme, catalog);
      if (next === data) return;
      data = next; persist(); draw();
    },
    open, close, refresh: draw,
    dispose() { if (disposed) return; close(); dragCleanup?.(); dragCleanup = null; disposed = true; window.removeEventListener('keydown', keydown); window.removeEventListener('resize', resize); overlay.remove(); panel.remove(); },
  };
  draw();
  return api;
}

function safeRead(storage?: Pick<Storage, 'getItem' | 'setItem'>): string | null { try { return getStorage(storage)?.getItem(STICKER_STORAGE_KEY) ?? null; } catch { return null; } }
function getStorage(storage?: Pick<Storage, 'getItem' | 'setItem'>): Pick<Storage, 'getItem' | 'setItem'> | undefined { try { return storage ?? window.localStorage; } catch { return undefined; } }
function themeLabel(theme: ThemeId): string { return theme === 'ocean' ? 'Océano' : theme === 'space' ? 'Espacio' : 'Capibaras'; }
