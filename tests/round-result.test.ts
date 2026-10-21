import test from 'node:test';
import assert from 'node:assert/strict';
import { mountRoundResult } from '../src/ui/round-result';
import { createCelebration, type CelebrationTimer } from '../src/celebration/celebration-controller';
import { GameSession } from '../src/game/session';
import { initPhysics } from '../src/physics';
import { PLAYER_TOY_SETTINGS } from '../src/models/selected-toy';
import { DEFAULT_STICKERS } from '../src/stickers';
await initPhysics();
class FakeClassList {
  private values = new Set<string>();
  add(value: string) { this.values.add(value); }
  remove(value: string) { this.values.delete(value); }
  contains(value: string) { return this.values.has(value); }
}

class FakeElement {
  ownerDocument!: FakeDocument;
  children: FakeElement[] = [];
  parent?: FakeElement;
  className = '';
  id = ''; hidden = false; disabled = false; type = ''; textContent = ''; focuses = 0;
  listeners = new Map<string, () => void>();
  append(...children: FakeElement[]) { children.forEach(child => this.appendChild(child)); }
  addEventListener(name: string, action: () => void) { this.listeners.set(name, action); }
  removeEventListener(name: string, _action: () => void) { this.listeners.delete(name); }
  focus(_options?: {preventScroll?: boolean}) { this.focuses++; }
  click() { if (!this.disabled) this.listeners.get('click')?.(); }

  classList = new FakeClassList();
  dataset: Record<string, string> = {};
  attributes = new Map<string, string>();
  style = { setProperty: (_name: string, _value: string) => undefined };
  src = '';
  alt = '';
  draggable = true;
  removed = false;
  appendChild<T extends FakeElement>(child: T): T { child.parent = this; this.children.push(child); return child; }
  replaceChildren(...children: FakeElement[]) { this.children = []; for (const child of children) this.appendChild(child); }
  setAttribute(name: string, value: string) { this.attributes.set(name, value); }
  remove() { this.removed = true; if (this.parent) this.parent.children = this.parent.children.filter(item => item !== this); }
}

class FakeDocument {
  createElement(_tag: string) { const element = new FakeElement(); element.ownerDocument = this; return element; }
}

class FakeTimer implements CelebrationTimer {
  time = 0;
  nextId = 0;
  pending = new Map<number, { at: number; callback: () => void }>();
  callbacks: Array<() => void> = [];
  now = () => this.time;
  setTimeout = (callback: () => void, delayMs: number) => {
    const id = ++this.nextId;
    const entry = { at: this.time + delayMs, callback };
    this.pending.set(id, entry); this.callbacks.push(callback); return id;
  };
  clearTimeout = (handle: unknown) => { this.pending.delete(handle as number); };
  advance(ms: number) {
    this.time += ms;
    for (const [id, item] of [...this.pending]) {
      if (item.at <= this.time) { this.pending.delete(id); item.callback(); }
    }
  }
}


const find = (parent: FakeElement, id: string): FakeElement => {
 const result = parent.children.find(child => child.id === id);
 assert.ok(result, id); return result;
};

test('real wins retain a result and new-game action after transient feedback expires, across both models/rules', () => {
 for (const model of ['single-button', 'two-button'] as const) for (const mode of ['collect', 'classic'] as const) {
  const doc = new FakeDocument(), host = doc.createElement('div'), timer = new FakeTimer();
  const session = new GameSession({lab: PLAYER_TOY_SETTINGS, model, mode, scene:'stack'});
  session.startRound();
  const celebration = createCelebration(host as unknown as HTMLElement, {theme:'space',roundId:session.snapshot().roundId,timer});
  let newGames=0;
  const result=mountRoundResult(host as unknown as HTMLElement,()=>{newGames++;session.startRound();celebration.setRound(session.snapshot().roundId);});
  try {
   result.update(session.snapshot(),'space'); const panel=find(host,'round-result'), button=find(panel,'new-game');
   assert.equal(panel.hidden,true); button.click(); assert.equal(newGames,0);
   for(let tick=0;tick<1440&&!session.snapshot().won;tick++)session.step();
   const completed=session.snapshot(); assert.equal(completed.won,true);
   // Deliberately omit event delivery: composition can reconcile visual feedback from won state.
   for(let frame=0;frame<3;frame++){
    celebration.handle({type:'victory',roundId:completed.roundId,mode:completed.mode});
    result.update(completed,'space');
   }
   assert.equal(panel.hidden,false); assert.equal(button.disabled,false);
   assert.match(find(panel,'round-result-detail').textContent,/12 aros/);
   assert.equal(button.focuses,1,'no repeated focus stealing on every animation frame');
   assert.equal(host.children[0].dataset.state,'active'); assert.equal(timer.callbacks.length,1);
   timer.advance(8000);
   celebration.handle({type:'victory',roundId:completed.roundId,mode:completed.mode});
   result.update(completed,'space');
   assert.equal(host.children[0].dataset.state,'idle'); assert.equal(timer.callbacks.length,1);
   assert.equal(panel.hidden,false,'the result outlives the four-second effect');
   assert.equal(button.disabled,false);
   button.click();button.click();assert.equal(newGames,1,'double activation cannot start two rounds');
   result.update(session.snapshot(),'space');
   assert.equal(panel.hidden,true);assert.equal(session.snapshot().total,12);assert.equal(session.snapshot().active,12);
   assert.equal(session.snapshot().collected,0);assert.equal(session.snapshot().won,false);
   assert.equal(session.snapshot().model,model);assert.equal(session.snapshot().mode,mode);
   assert.equal(session.simulation.layout.width,8);assert.equal(session.simulation.layout.pegLayout,'raised');
   assert.equal(host.children[0].dataset.state,'idle');
  } finally {result.dispose();celebration.dispose();session.dispose();}
 }
});

test('outcome uses the actual target, changes themed art without replaying victory, and disposes listeners',()=>{
 const doc=new FakeDocument(),host=doc.createElement('div'),session=new GameSession({lab:PLAYER_TOY_SETTINGS});
 let actions=0;const result=mountRoundResult(host as unknown as HTMLElement,()=>actions++);
 try {
  // View-only contract: a completed dynamic target must never be hard-coded to twelve.
  const completed={...session.snapshot(),won:true,total:14,collected:14,paused:['manual' as const]};
  result.update(completed,'ocean');const panel=find(host,'round-result'),button=find(panel,'new-game');
  assert.match(find(panel,'round-result-detail').textContent,/14 aros/);assert.equal(panel.dataset.paused,'true');
  for(const sticker of DEFAULT_STICKERS){result.update(completed,sticker.theme);assert.equal(panel.children[0].src,sticker.src);}
  assert.equal(button.focuses,1);result.dispose();assert.equal(host.children.length,0);
  button.click();result.update(completed,'ocean');assert.equal(actions,0);assert.equal(host.children.length,0);
 }finally{result.dispose();session.dispose();}
});
