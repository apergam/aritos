import type { SessionSnapshot } from '../game/session';
import type { ThemeId } from '../themes';
import { DEFAULT_STICKERS } from '../stickers';

/** Persistent round outcome, independent of transient victory effects or event timing. */
export function mountRoundResult(host: HTMLElement, onNewGame: () => void) {
 const doc = host.ownerDocument;
 const panel = doc.createElement('section');
 panel.id = 'round-result'; panel.className = 'round-result'; panel.hidden = true;
 panel.setAttribute('aria-labelledby', 'round-result-title');
 const art = doc.createElement('img'); art.className = 'round-result__art'; art.alt = ''; art.draggable = false;
 const eyebrow = doc.createElement('p'); eyebrow.className = 'round-result__eyebrow'; eyebrow.textContent = 'RONDA COMPLETA';
 const title = doc.createElement('h2'); title.id = 'round-result-title'; title.textContent = '¡Lo lograste!';
 const detail = doc.createElement('p'); detail.id = 'round-result-detail'; detail.setAttribute('role', 'status');
 const next = doc.createElement('button'); next.id = 'new-game'; next.type = 'button'; next.className = 'primary-button'; next.textContent = 'Nueva partida';
 panel.append(art, eyebrow, title, detail, next); host.append(panel);
 let visible = false, disposed = false, key = '';
 const playAgain = () => {
  if (disposed || !visible || next.disabled) return;
  visible = false; panel.hidden = true; next.disabled = true;
  onNewGame();
 };
 next.addEventListener('click', playAgain);
 return {
  update(snapshot: SessionSnapshot, theme: ThemeId) {
   if (disposed) return;
   const wasVisible = visible; visible = snapshot.won; panel.hidden = !visible;
   panel.dataset.paused = String(snapshot.paused.length > 0);
   if (!visible) { key = ''; next.disabled = true; return; }
   next.disabled = false;
   const nextKey = `${snapshot.roundId}:${snapshot.mode}:${snapshot.total}:${theme}`;
   if (key !== nextKey) {
    art.src = DEFAULT_STICKERS.find(item => item.theme === theme)!.src;
    detail.textContent = snapshot.mode === 'collect' ? `Guardaste los ${snapshot.total} aros. ¡Bien jugado!` : `Ensartaste los ${snapshot.total} aros. ¡Bien jugado!`;
    key = nextKey;
   }
   if (!wasVisible) next.focus();
  },
  dispose() { if (disposed) return; disposed = true; next.removeEventListener('click', playAgain); panel.remove(); },
 };
}
