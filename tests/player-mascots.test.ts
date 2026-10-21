import test from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier3d-compat';
import { GameSession } from '../src/game/session';
import { PlayerMascots } from '../src/game/mascots/player-mascots';
import { PLAYER_TOY_SETTINGS } from '../src/models/selected-toy';
import { DT, initPhysics } from '../src/physics';
await initPhysics();
function setup(model:'single-button'|'two-button'='two-button',mode:'classic'|'collect'='collect') {
 const session=new GameSession({lab:PLAYER_TOY_SETTINGS,model,mode});
 const audio={unlocks:0,plays:0,stops:0,disposed:false};const ducks:boolean[]=[];
 const mascots=new PlayerMascots(session,value=>ducks.push(value),{
  unlock:async()=>{audio.unlocks++;},play:async()=>{audio.plays++;},stop:()=>{audio.stops++;},dispose:()=>{audio.disposed=true;},
 });
 return {session,mascots,audio,ducks};
}
function tick(session:GameSession,mascots:PlayerMascots,n=1){for(let i=0;i<n;i++){mascots.beforeStep();session.step();mascots.update();}}
function floorFixture(session:GameSession){
 const sim=session.simulation;
 for(const ring of sim.rings)sim.world.removeRigidBody(ring.body);
 sim.rings=[];sim.totalRings=0;
 return sim.addRing(-3.25,-5.2,0);
}

test('manual helper serializes mascot actions, freezes on pause and lets physics collect',()=>{
 const {session,mascots}=setup();const ring=floorFixture(session);
 try {
  assert.equal(mascots.requestAssist('thread'),true);
  assert.equal(mascots.state.actor?.villain,false);
  assert.equal(mascots.requestAssist('above'),false);
  assert.equal(mascots.requestVillain(2),false);
  tick(session,mascots,60);const before={...ring.body.translation()};
  session.dispatch({type:'pause',reason:'menu',paused:true});mascots.setPaused(true);
  tick(session,mascots,120);assert.deepEqual({...ring.body.translation()},before);
  session.dispatch({type:'pause',reason:'menu',paused:false});mascots.setPaused(false);
  for(let i=0;i<8/DT&&!session.snapshot().won;i++)tick(session,mascots);
  assert.equal(session.snapshot().collected,1);assert.equal(session.snapshot().won,true);
 }finally{mascots.dispose();session.dispose();}
});

test('normal selected layout combines manual red challenge and helpers across models and modes',()=>{
 for(const model of ['single-button','two-button']as const)for(const mode of ['collect','classic']as const){
 const {session,mascots}=setup(model,mode);
 try{
  const originalIds=session.snapshot().rings.map(r=>r.id);
  assert.equal(mascots.requestVillain(2),true);mascots.beforeStep();
  assert.equal(session.snapshot().total,14);assert.equal(mascots.extraRingIds.size,2);
  assert.equal(mascots.state.actor?.villain,true);assert.equal(mascots.state.enemyUsed,true);
  assert.equal(mascots.requestAssist('above'),false);
  tick(session,mascots,600);
  assert.equal(mascots.state.busy,false);
  assert.equal(mascots.requestVillain(1),false);
  assert.ok(originalIds.every(id=>session.snapshot().rings.some(r=>r.id===id)||mode==='collect'));
  const floorRing=session.simulation.rings.find(r=>!session.simulation.isThreaded(r)&&r.body.translation().y<=-4.6);
  assert.ok(floorRing);assert.equal(mascots.requestAssist('above'),true);
  tick(session,mascots,240);assert.equal(mascots.state.busy,false);
  assert.equal(session.simulation.escaped,false);
 }finally{mascots.dispose();session.dispose();}
 }
});

test('cue obeys sound/music gate, ducks without replacing theme and stops on pause/reset/disposal',()=>{
 const {session,mascots,audio,ducks}=setup();
 try{
  mascots.setAudioEnabled(true);mascots.requestVillain(1);mascots.beforeStep();
  assert.equal(audio.unlocks,1);assert.equal(audio.plays,1);assert.equal(ducks.at(-1),true);
  mascots.setAudioEnabled(false);assert.equal(ducks.at(-1),false);
  session.dispatch({type:'pause',reason:'manual',paused:true});mascots.setPaused(true);
  assert.equal(ducks.at(-1),false);assert.ok(mascots.state.actor);
  mascots.reset();session.startRound();session.dispatch({type:'pause',reason:'manual',paused:false});assert.equal(mascots.state.enemyUsed,false);
  assert.equal(mascots.requestVillain(2),true);mascots.beforeStep();assert.equal(audio.plays,1,'muted encounter stays silent');
  mascots.dispose();assert.equal(audio.disposed,true);assert.equal(ducks.at(-1),false);
 }finally{mascots.dispose();session.dispose();}
});

test('pausing cancels pending enemy request and restart restores a carried body before replacing world',()=>{
 const {session,mascots}=setup();
 try{
  mascots.requestVillain(2);session.dispatch({type:'pause',reason:'menu',paused:true});mascots.setPaused(true);
  session.dispatch({type:'pause',reason:'menu',paused:false});tick(session,mascots);
  assert.equal(session.snapshot().total,12);assert.equal(mascots.state.enemyUsed,false);
  const ring=floorFixture(session);assert.equal(mascots.requestAssist('above'),true);
  assert.equal(ring.body.bodyType(),RAPIER.RigidBodyType.KinematicPositionBased);
  mascots.reset();assert.equal(ring.body.bodyType(),RAPIER.RigidBodyType.Dynamic);
  session.startRound();assert.equal(mascots.state.busy,false);assert.equal(session.snapshot().total,12);
  assert.equal(session.simulation.layout.width,8);assert.equal(session.simulation.layout.pegLayout,'raised');
 }finally{mascots.dispose();session.dispose();}
});
