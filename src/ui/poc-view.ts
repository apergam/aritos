import type { SessionSnapshot } from '../game/session';

/** Projects round state into the existing POC's Spanish status readouts. */
export function renderPocStatus(root: ParentNode, snapshot: SessionSnapshot): void {
  const count = (id: string) => root.querySelector<HTMLElement>(`#${id}`);
  const label = count('count-label'), value = count('count');
  if (label) label.textContent = snapshot.mode === 'collect' ? 'GUARDADOS' : 'ENSARTADOS';
  if (value) value.textContent = `${snapshot.mode === 'collect' ? snapshot.collected : snapshot.rings.filter(r => r.threaded).length} / ${snapshot.total}`;
  const status = count('status');
  if (status && snapshot.escaped) status.textContent = 'Revisar: un aro salió del depósito';
}
