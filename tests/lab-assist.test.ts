import { test } from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier3d-compat';
import { DT, initPhysics, type Ring } from '../src/physics.ts';
import { GameSession } from '../src/game/session.ts';
import { RingAssistController } from '../src/lab/experiments/assist.ts';
await initPhysics();

function clearRings(session:GameSession){
 const simulation=session.simulation;
 for(const ring of simulation.rings)simulation.world.removeRigidBody(ring.body);
 simulation.rings=[];simulation.totalRings=0;simulation.collected=0;simulation.won=false;
}
function setup(mode:'classic'|'collect'='collect'){
 const session=new GameSession({scene:'depth',mode});clearRings(session);
 const ring=session.simulation.addRing(-3.7,-5.2,0);
 return {session,ring,assist:new RingAssistController(session)};
}
function tick(session:GameSession,assist:RingAssistController,count=1){
 for(let i=0;i<count;i++){assist.beforeStep();session.step();}
}
const bodyType=(ring:Ring)=>ring.body.bodyType();

test('thread assist scripts one stable ring to a real peg/base collection',()=>{
 const {session,ring,assist}=setup('collect');
 try {
  const accepted=assist.request('thread');assert.equal(accepted.accepted,true);assert.equal(accepted.ringId,ring.id);
  assert.equal(assist.state.movement,'scripted');assert.equal(assist.state.phase,'approach');
  assert.equal(assist.scriptedCount,1);
  for(let i=0;i<4/DT&&session.simulation.collected===0;i++)tick(session,assist);
  assert.equal(session.simulation.collected,1);
  assert.equal(session.simulation.totalRings,1);
  assert.equal(session.simulation.rings.length,0);
  assert.equal(session.simulation.won,true);
  assert.equal(assist.state.active,false);
 } finally {assist.dispose();session.dispose();}
});

test('above assist releases above the tip and does not award progress itself',()=>{
 const {session,ring,assist}=setup('collect');
 try {
  assert.equal(assist.request('above').accepted,true);
  tick(session,assist,240);
  assert.equal(assist.state.active,false);
  assert.equal(session.simulation.collected,0);
  assert.equal(session.simulation.count,0);
  assert.ok(ring.body.translation().y>session.simulation.layout.pegs[0].tipY);
  assert.equal(bodyType(ring),RAPIER.RigidBodyType.Dynamic);
 } finally {assist.dispose();session.dispose();}
});

test('no floor target, a blocked destination, and duplicate requests are rejected',()=>{
 const session=new GameSession({scene:'depth',mode:'collect'}),assist=new RingAssistController(session);
 try {assert.deepEqual(assist.request('thread'),{accepted:false,reason:'no-eligible-ring'});}
 finally {assist.dispose();session.dispose();}

 const blocked=new GameSession({scene:'depth',mode:'collect'});clearRings(blocked);
 try {
  const simulation=blocked.simulation;
  for(const peg of simulation.layout.pegs)simulation.addRing(peg.x,peg.baseY+1,peg.z);
  simulation.addRing(-3.7,-5.2,0);
  const controller=new RingAssistController(blocked);
  try {
   assert.deepEqual(controller.request('thread'),{accepted:false,reason:'blocked-destination'});
   const freePeg=simulation.layout.pegs[0];
   for(const ring of simulation.rings)if(simulation.isThreaded(ring)&&Math.abs(ring.body.translation().x-freePeg.x)<.35)simulation.world.removeRigidBody(ring.body);
   simulation.rings=simulation.rings.filter(r=>r.body.isValid());
   simulation.addRing(-3.7,-5.2,0);
   const selected=controller.request('thread');assert.equal(selected.accepted,true);
   assert.deepEqual(controller.request('above'),{accepted:false,reason:'busy'});
   assert.ok(controller.state.active);assert.equal(controller.state.ringId,selected.ringId);assert.ok(selected.ringId!==undefined);
  } finally {controller.dispose();}
 } finally {blocked.dispose();}
});

test('pause freezes path progress; cancel restores dynamics; stale rounds discard old refs',()=>{
 const {session,ring,assist}=setup('classic');
 try {
  assert.equal(assist.request('thread').accepted,true);
  tick(session,assist,30);
  const position=assist.state.position!,progress=assist.state.progress;
  session.dispatch({type:'pause',reason:'manual',paused:true});
  tick(session,assist,40);
  assert.equal(assist.state.progress,progress);assert.deepEqual(assist.state.position,position);
  session.dispatch({type:'pause',reason:'manual',paused:false});
  tick(session,assist,1);assert.ok(assist.state.progress>progress);
  assist.cancel();assert.equal(assist.state.active,false);assert.equal(bodyType(ring),RAPIER.RigidBodyType.Dynamic);
  session.simulation.addRing(-3.7,-5.2,0);
  assert.equal(assist.request('above').accepted,true);
  session.startRound({scene:'depth'});
  tick(session,assist,1);
  assert.equal(assist.state.active,false);
 } finally {assist.dispose();session.dispose();}
});

test('stale IDs and disposal never leave a kinematic body behind',()=>{
 const {session,ring,assist}=setup('classic');
 try {
  assert.deepEqual(assist.request('thread',session.snapshot().roundId-1),{accepted:false,reason:'stale-round'});
  assert.equal(assist.request('thread').accepted,true);
  assist.dispose();assert.equal(bodyType(ring),RAPIER.RigidBodyType.Dynamic);
  assert.equal(assist.request('above').reason,'disposed');
 } finally {session.dispose();}
});


test('both models and rule modes use the same one-ring scripted assist',()=>{
 for(const model of ['single-button','two-button'] as const)for(const mode of ['classic','collect'] as const){
  const session=new GameSession({scene:'depth',model,mode});clearRings(session);
  const ring=session.simulation.addRing(-3.7,-5.2,0),assist=new RingAssistController(session);
  try {
   const accepted=assist.request('above');assert.equal(accepted.accepted,true,`${model}/${mode}`);
   assert.equal(accepted.ringId,ring.id);tick(session,assist,240);
   assert.equal(session.simulation.totalRings,1);assert.equal(session.simulation.rings.length,1);
   assert.equal(session.simulation.collected,0);assert.equal(session.simulation.won,false);
   assert.equal(assist.state.active,false);assert.equal(bodyType(ring),RAPIER.RigidBodyType.Dynamic);
  } finally {assist.dispose();session.dispose();}
 }
});


test('controller disposal after the session frees its world safely',()=>{
 const {session,assist}=setup('classic');
 assert.equal(assist.request('thread').accepted,true);
 session.dispose();
 assert.equal(assist.state.active,false);
 assist.dispose();
});

test('above assist remains available with both pegs occupied and resets usage on the next round',()=>{
 const session=new GameSession({scene:'depth',mode:'classic'});clearRings(session);
 const simulation=session.simulation;
 for(const peg of simulation.layout.pegs)simulation.addRing(peg.x,peg.baseY+1,peg.z);
 const loose=simulation.addRing(-3.7,-5.2,0),assist=new RingAssistController(session);
 try {
  const accepted=assist.request('above');assert.equal(accepted.accepted,true);assert.equal(accepted.ringId,loose.id);
  tick(session,assist,240);
  assert.equal(simulation.collected,0);assert.equal(simulation.won,false);assert.equal(assist.scriptedCount,1);
  session.startRound({scene:'depth'});
  assert.equal(assist.scriptedCount,0);
 } finally {assist.dispose();session.dispose();}
});

test('above assist rejects destinations occupied by other ring bodies',()=>{
 const session=new GameSession({scene:'depth',mode:'collect'});clearRings(session);
 const simulation=session.simulation;
 for(const peg of simulation.layout.pegs)simulation.addRing(peg.x,peg.tipY+.8,peg.z);
 simulation.addRing(-3.7,-5.2,0);
 const assist=new RingAssistController(session);
 try {assert.deepEqual(assist.request('above'),{accepted:false,reason:'blocked-destination'});}
 finally {assist.dispose();session.dispose();}
});
