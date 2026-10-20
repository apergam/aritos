import test from 'node:test';
import assert from 'node:assert/strict';
import { GameSession } from '../src/game/session';
import { initPhysics } from '../src/physics';

test('session snapshots are immutable, body-free, and scoped to a round', async () => {
  await initPhysics();
  const session = new GameSession({ scene: 'drop' });
  try {
    const first = session.snapshot();
    assert.equal(first.roundId, 0);
    assert.equal(first.rings.length, 2);
    assert.equal('body' in first.rings[0]!, false);
    assert.equal(Object.isFrozen(first.rings), true);
    assert.deepEqual(first.rings.map(r => r.id), [0, 1]);
    session.startRound();
    const second = session.snapshot();
    assert.equal(second.roundId, first.roundId + 1);
    assert.deepEqual(second.rings.map(r => r.id), [0, 1]);
  } finally { session.dispose(); }
});

test('pause reasons compose and prevent active simulation steps', async () => {
  await initPhysics();
  const session = new GameSession({ scene: 'drop' });
  try {
    session.dispatch({ type: 'pause', reason: 'manual', paused: true });
    session.dispatch({ type: 'pause', reason: 'document-hidden', paused: true });
    session.dispatch({ type: 'pause', reason: 'manual', paused: false });
    assert.deepEqual(session.pauseReasons, ['document-hidden']);
    const before = session.snapshot().activeSeconds;
    session.step();
    assert.equal(session.snapshot().activeSeconds, before);
    session.dispatch({ type: 'pause', reason: 'document-hidden', paused: false });
    session.step();
    assert.ok(session.snapshot().activeSeconds > before);
  } finally { session.dispose(); }
});

test('restart clears settings flow pauses but preserves manual and document-hidden pauses', async () => {
  await initPhysics();
  const session = new GameSession({ scene: 'drop' });
  try {
    const round = session.snapshot().roundId;
    session.dispatch({ type: 'pause', reason: 'menu', paused: true });
    session.dispatch({ type: 'pause', reason: 'restart-confirmation', paused: true });
    session.dispatch({ type: 'pause', reason: 'manual', paused: true });
    session.dispatch({ type: 'pause', reason: 'document-hidden', paused: true });

    // Canceling confirmation only removes its own reason and preserves the round.
    session.dispatch({ type: 'pause', reason: 'restart-confirmation', paused: false });
    assert.equal(session.snapshot().roundId, round);
    assert.deepEqual(session.pauseReasons, ['menu', 'manual', 'document-hidden']);
    session.dispatch({ type: 'restart' });
    assert.equal(session.snapshot().roundId, round + 1);
    assert.deepEqual(session.pauseReasons, ['manual', 'document-hidden']);
    const elapsed = session.snapshot().activeSeconds;
    session.step();
    assert.equal(session.snapshot().activeSeconds, elapsed);
    session.dispatch({ type: 'pause', reason: 'document-hidden', paused: false });
    session.dispatch({ type: 'pause', reason: 'manual', paused: false });
    session.step();
    assert.ok(session.snapshot().activeSeconds > elapsed);
  } finally { session.dispose(); }
});

test('model and mode transitions start fresh rounds; pumps follow the selected model', async () => {
  await initPhysics();
  const session = new GameSession({ scene: 'drop', model: 'single-button', mode: 'classic' });
  const events: string[] = [];
  session.subscribe(event => { if (event.type === 'pump') events.push(event.side); });
  try {
    session.dispatch({ type: 'pump', side: 'left' });
    assert.equal(session.simulation.pulses.length, 0);
    session.dispatch({ type: 'pump', side: 'center' });
    assert.deepEqual(events, ['center']);

    const before = session.snapshot().roundId;
    session.dispatch({ type: 'set-model', model: 'two-button' });
    assert.equal(session.snapshot().roundId, before + 1);
    assert.equal(session.snapshot().model, 'two-button');
    session.dispatch({ type: 'pump', side: 'center' });
    session.dispatch({ type: 'pump', side: 'right' });
    assert.deepEqual(events, ['center', 'right']);

    session.dispatch({ type: 'set-mode', mode: 'collect' });
    assert.equal(session.snapshot().roundId, before + 2);
    assert.equal(session.snapshot().mode, 'collect');
  } finally { session.dispose(); }
});

test('collect victory follows all collection events and listeners may safely dispose', async () => {
  await initPhysics();
  const session = new GameSession({ scene: 'stack', mode: 'collect' });
  const received: string[] = [];
  session.subscribe(event => {
    received.push(event.type);
    if (event.type === 'victory') session.dispose();
  });
  try {
    for (let i = 0; i < 1500 && !session.simulation.won; i++) session.step();
    assert.equal(session.simulation.won, true);
    assert.equal(received.filter(event => event === 'ring-collected').length, 12);
    assert.equal(received.at(-1), 'victory');
    assert.doesNotThrow(() => session.step());
  } finally { session.dispose(); }
});

test('classic victory lands on the same active tick across render schedules', async () => {
  await initPhysics();
  const run = (frames: number[]) => {
    const session = new GameSession({ scene: 'stack', mode: 'classic' });
    session.simulation.setGravity({ x: 0, y: 0, z: 0 });
    let accumulator = 0;
    const dt = 1 / 120;
    let victoryAt: number | undefined;
    session.subscribe(event => { if (event.type === 'victory') victoryAt = session.snapshot().activeSeconds; });
    for (const frameSeconds of frames) {
      accumulator += frameSeconds;
      while (accumulator + 1e-10 >= dt && !session.simulation.won) { session.step(); accumulator -= dt; }
    }
    session.dispose();
    return victoryAt;
  };
  const evenlyScheduled = Array.from({ length: 126 }, () => 1 / 60);
  const unevenWeights = [30, 4, 21, 9, 16, 20, 10, 40, 17, 13, 20, 30, 20, 15, 25, 30, 20, 30, 20, 20, 30, 30, 20, 20, 20, 20, 20, 15];
  const weightTotal = unevenWeights.reduce((a, b) => a + b, 0);
  const unevenlyScheduled = unevenWeights.map(weight => 2.1 * weight / weightTotal);
  const evenlyScheduledVictory = run(evenlyScheduled);
  const unevenlyScheduledVictory = run(unevenlyScheduled);
  assert.ok(evenlyScheduledVictory !== undefined && evenlyScheduledVictory >= 2 && evenlyScheduledVictory <= 2 + 1 / 120);
  assert.equal(evenlyScheduledVictory, unevenlyScheduledVictory);
});

test('classic victory listener can restart after the physics step without stale events', async () => {
  await initPhysics();
  const session = new GameSession({ scene: 'stack', mode: 'classic' });
  session.simulation.setGravity({ x: 0, y: 0, z: 0 });
  const received: number[] = [];
  session.subscribe(event => {
    if (event.type === 'victory') {
      received.push(event.roundId);
      session.startRound({ scene: 'drop', mode: 'classic' });
    }
  });
  session.subscribe(event => { if (event.type === 'victory') received.push(event.roundId); });
  try {
    for (let i = 0; i < 300 && session.snapshot().roundId === 0; i++) session.step();
    assert.deepEqual(received, [0]);
    assert.equal(session.snapshot().roundId, 1);
    assert.equal(session.simulation.won, false);
    assert.equal(session.snapshot().activeSeconds, 0);
  } finally { session.dispose(); }
});

test('hidden time cannot accumulate into active simulation time', async () => {
  await initPhysics();
  const session = new GameSession({ scene: 'drop', mode: 'classic' });
  try {
    session.dispatch({ type: 'pause', reason: 'document-hidden', paused: true });
    for (let i = 0; i < 7200; i++) session.step();
    assert.equal(session.snapshot().activeSeconds, 0);
    session.dispatch({ type: 'pause', reason: 'document-hidden', paused: false });
    session.step();
    assert.equal(session.snapshot().activeSeconds, 1 / 120);
  } finally { session.dispose(); }
});

test('fresh stack rounds repeat the same physical outcome after immediate restart', async () => {
 await initPhysics();
 const session = new GameSession({ scene: 'stack', mode: 'collect' });
 const victories: number[] = [];
 session.subscribe(event => { if (event.type === 'victory') victories.push(event.roundId); });
 try {
  // The player creates a paused preview and starts a fresh round on Jugar.
  session.startRound({ scene: 'stack', mode: 'collect' });
  for (let i=0;i<1440;i++) session.step();
  assert.equal(session.snapshot().collected, 12);
  assert.equal(session.snapshot().active, 0);
  assert.deepEqual(victories, [1]);
  session.dispatch({ type: 'restart' });
  for (let i=0;i<1440;i++) session.step();
  assert.equal(session.snapshot().collected, 12);
  assert.deepEqual(victories, [1,2]);
 } finally { session.dispose(); }
});

test('classic requires uninterrupted active time and cannot celebrate twice before restart', async () => {
 await initPhysics();
 const session = new GameSession({ scene: 'stack', mode: 'classic' });
 const victories: number[] = [];
 session.subscribe(event => { if (event.type === 'victory') victories.push(event.roundId); });
 const step = (ticks:number) => { for(let i=0;i<ticks;i++)session.step(); };
 try {
  session.simulation.setGravity({ x:0, y:0, z:0 });
  step(120); assert.equal(session.snapshot().won, false);
  session.dispatch({type:'pause',reason:'menu',paused:true});
  const active=session.snapshot().activeSeconds; step(360);
  assert.equal(session.snapshot().activeSeconds,active); assert.deepEqual(victories,[]);
  session.dispatch({type:'pause',reason:'menu',paused:false});
  const ring=session.simulation.rings[0]!, position={...ring.body.translation()};
  // Fixture placement makes the loss/rethreading instant so the timer is isolated.
  ring.body.setTranslation({x:3.4,y:0,z:0},true); step(1);
  ring.body.setTranslation(position,true); ring.body.setLinvel({x:0,y:0,z:0},true);
  step(120); assert.deepEqual(victories,[],'the first second cannot carry across a lost ring');
  step(130); assert.deepEqual(victories,[0]);
  ring.body.setTranslation({x:3.4,y:0,z:0},true); step(1);
  ring.body.setTranslation(position,true); ring.body.setLinvel({x:0,y:0,z:0},true);
  step(260); assert.deepEqual(victories,[0],'rethreading after victory must not celebrate again');
  session.dispatch({type:'restart'}); session.simulation.setGravity({x:0,y:0,z:0});
  step(260); assert.deepEqual(victories,[0,1]);
 } finally { session.dispose(); }
});


test('decoration pause hands off from menu and preserves manual/hidden pauses', async () => {
 await initPhysics();
 const session = new GameSession({ scene: 'drop' });
 try {
  session.dispatch({ type: 'pause', reason: 'menu', paused: true });
  session.dispatch({ type: 'pause', reason: 'decoration', paused: true });
  session.dispatch({ type: 'pause', reason: 'menu', paused: false });
  const before = session.snapshot();
  session.dispatch({ type: 'pump', side: 'left' }); session.step();
  assert.deepEqual(session.snapshot().rings, before.rings);
  assert.equal(session.simulation.pulses.length, 0);
  session.dispatch({ type: 'pause', reason: 'manual', paused: true });
  session.dispatch({ type: 'pause', reason: 'document-hidden', paused: true });
  session.dispatch({ type: 'pause', reason: 'decoration', paused: false });
  assert.deepEqual(session.pauseReasons, ['manual', 'document-hidden']);
 } finally { session.dispose(); }
});
