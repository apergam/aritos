import test from 'node:test';
import assert from 'node:assert/strict';
import { Quaternion, Vector3 } from 'three';
import { GameSession } from '../src/game/session';
import { PlayerMascots } from '../src/game/mascots/player-mascots';
import { VillainSchedule, remainingRings } from '../src/game/mascots/villain-schedule';
import { VillainEncounterController } from '../src/lab/experiments/enemies';
import { LINKED_RING_SEPARATION } from '../src/physics/linked-rings';
import { initPhysics, Simulation, horizontal, type Ring } from '../src/physics';
import { PLAYER_TOY_SETTINGS } from '../src/models/selected-toy';
import { ringData, linking } from '../scripts/diagnostics/ring-links/link-math';
await initPhysics();

function setup(left=5,random=()=>0) {
 const session=new GameSession({lab:PLAYER_TOY_SETTINGS});
 const cue={plays:0,unlocks:0,unlock:async()=>{cue.unlocks++;},play:async()=>{cue.plays++;},stop:()=>{},dispose:()=>{}};
 let draws=0;const seeded=()=>draws++===0?1:random();
 const mascots=new PlayerMascots(session,()=>{},cue,{automaticVillain:true,random:seeded});
 fixture(session,left);return {session,mascots,cue};
}
function fixture(session:GameSession,left:number) {
 const s=session.simulation;
 for(const r of s.rings.slice(left))s.world.removeRigidBody(r.body);
 s.rings=s.rings.slice(0,left);s.collected=12-left;
 s.rings.forEach((r,i)=>{r.body.setTranslation({x:[-3.25,0,3.25][i%3],y:-5.2+Math.floor(i/3)*1.6,z:0},true);r.body.setRotation(horizontal,true);r.body.setLinvel({x:0,y:0,z:0},true);r.body.setAngvel({x:0,y:0,z:0},true);});
}
function tick(session:GameSession,mascots:PlayerMascots,n:number) {for(let i=0;i<n;i++){mascots.beforeStep();session.step();mascots.update();}}
const link=(a:Ring,b:Ring)=>Math.abs(linking(ringData(a),ringData(b)));

test('random wait is restricted to 1–5 remaining, uses classic unthreaded count and never fires at victory',()=>{
 const session=new GameSession({lab:PLAYER_TOY_SETTINGS});
 try {
 const original=session.snapshot();
 let draw=0;const schedule=new VillainSchedule(()=>draw++===0?1:0);
 const at=(left:number,t:number,extra={})=>({...original,active:left,activeSeconds:t,...extra});
 assert.equal(schedule.ready(at(6,10),false,false),false);
 assert.equal(schedule.ready(at(5,10),false,false),false);
 assert.equal(schedule.ready(at(5,10.99),false,false),false);
 assert.equal(schedule.ready(at(1,11),false,false),true);
 assert.equal(schedule.ready(at(0,12),false,false),false);
 assert.equal(schedule.ready(at(1,14,{won:true}),false,false),false);
 assert.equal(schedule.ready(at(1,16),false,true),false);
 assert.equal(schedule.ready(at(1,18,{scene:'stack' as const}),false,false),false);
 const classic={...original,mode:'classic' as const,rings:original.rings.map((ring,i)=>({...ring,threaded:i<7}))};
 assert.equal(remainingRings(classic),5);
 assert.equal(remainingRings({...classic,rings:classic.rings.map(r=>({...r,threaded:true}))}),0);
 } finally {session.dispose();}
});

test('one and five remaining can trigger; random delay changes actual spawn time and preserves progress',()=>{
 for(const left of [1,5])for(const sample of [0,1]) {
 const {session,mascots,cue}=setup(left,()=>sample);mascots.setAudioEnabled(true);mascots.activateAudio();
 try {
 tick(session,mascots,120);assert.equal(session.snapshot().total,12,'not before the minimum wait');
 if(sample===1){tick(session,mascots,120);assert.equal(session.snapshot().total,12,'long draw does not fire at two seconds');}
 for(let i=0;i<300&&session.snapshot().total===12;i++)tick(session,mascots,1);
 assert.equal(session.snapshot().total,14);assert.equal(session.snapshot().collected,12-left);
 assert.equal(session.snapshot().active,left+2);assert.equal(cue.plays,1);
 const added=session.simulation.rings.filter(r=>mascots.extraRingIds.has(r.id));
 assert.equal(added.length,2);assert.equal(link(added[0],added[1]),1);
 assert.equal(mascots.state.actor?.villain,true);assert.match(mascots.state.message,/encadenados/);
 tick(session,mascots,500);assert.equal(session.snapshot().total,14);assert.equal(cue.plays,1);
 } finally {mascots.dispose();session.dispose();}
 }
});

test('six remaining, zero remaining and a completed round cannot summon an enemy',()=>{
 for(const left of [0,6]){
 const {session,mascots}=setup(left);
 try {tick(session,mascots,600);assert.equal(session.snapshot().total,12);assert.equal(mascots.extraRingIds.size,0);}
 finally{mascots.dispose();session.dispose();}
 }
 const {session,mascots}=setup(1);try{session.simulation.won=true;tick(session,mascots,600);assert.equal(session.snapshot().total,12);}finally{mascots.dispose();session.dispose();}
});

test('pauses freeze the wait and restart discards it; a helper finishes before the villain can enter',()=>{
 let draw=0;const {session,mascots}=setup(5,()=>[0,1,0][Math.min(draw++,2)]);
 try{
 tick(session,mascots,60);session.dispatch({type:'pause',reason:'document-hidden',paused:true});mascots.setPaused(true);
 tick(session,mascots,1200);assert.equal(session.snapshot().total,12);assert.ok(session.snapshot().activeSeconds<.51);
 session.dispatch({type:'pause',reason:'document-hidden',paused:false});mascots.setPaused(false);
 mascots.reset();session.startRound();tick(session,mascots,600);assert.equal(session.snapshot().total,12);
 fixture(session,5);assert.equal(mascots.requestAssist('thread'),true);
 tick(session,mascots,240);assert.equal(mascots.extraRingIds.size,0);
 for(let i=0;i<600&&session.snapshot().total===12;i++)tick(session,mascots,1);
 assert.equal(mascots.extraRingIds.size,2);
 }finally{mascots.dispose();session.dispose();}
});

test('unsafe automatic drops retry silently, without consuming the encounter or repeatedly playing audio',()=>{
 const {session,mascots,cue}=setup(1);mascots.setAudioEnabled(true);
 try {
 session.dispatch({type:'orient',gravity:{x:0,y:3,z:0}});tick(session,mascots,180);
 assert.equal(session.snapshot().total,12);assert.equal(mascots.extraRingIds.size,0);assert.equal(cue.plays,0);
 session.dispatch({type:'orient',gravity:{x:0,y:-3,z:0}});tick(session,mascots,180);
 assert.equal(session.snapshot().total,14);assert.equal(cue.plays,1);
 }finally{mascots.dispose();session.dispose();}
});

test('linked spawn has two disjoint dynamic bodies, no joints, and does not fall onto a peg for free',()=>{
 const {session,mascots}=setup(1);
 try {
 const enemy=new VillainEncounterController(session);assert.equal(enemy.requestLinkedPair().accepted,true);
 const result=enemy.beforeStep();assert.equal(result?.ok,true);assert.equal(result?.linked,true);
 const pair=session.simulation.rings.filter(r=>result!.spawned.includes(r.id));
 assert.equal(pair.length,2);assert.equal(link(pair[0],pair[1]),1);
 let separation=Infinity;
 for(let i=0;i<20;i++)for(let j=0;j<20;j++){
  const contact=pair[0].body.collider(i).contactCollider(pair[1].body.collider(j),5);
  if(contact)separation=Math.min(separation,contact.distance);
 }
 assert.ok(separation>.05,'their bounding spheres overlap, but their material does not');
 assert.equal(session.simulation.world.impulseJoints.len(),0);assert.equal(session.simulation.world.multibodyJoints.len(),0);
 for(let i=0;i<1200;i++)session.step();
 assert.equal(session.snapshot().collected,11);assert.equal(session.snapshot().total,14);assert.equal(link(pair[0],pair[1]),1);
 assert.equal(session.simulation.escaped,false);enemy.dispose();
 }finally{mascots.dispose();session.dispose();}
});

test('collecting one member through real contact leaves its linked partner active',()=>{
 const s=new Simulation(PLAYER_TOY_SETTINGS);s.mode='collect';
 try {
 const p=s.layout.pegs[0];
 const a=s.addRing(p.x,p.baseY+.85,0,horizontal),b=s.addRing(p.x+.77,p.baseY+.85,0,new Quaternion());
 assert.equal(link(a,b),1);
 for(let i=0;i<2400&&s.collected===0;i++)s.step();
 assert.equal(s.collected,1);assert.equal(s.rings.length,1);assert.equal(s.totalRings,2);assert.equal(s.won,false);
 assert.equal(s.rings[0].id,b.id);assert.equal(b.body.isValid(),true);
 }finally{s.dispose();}
});

test('a genuine linked pair can complete a fourteen-ring classic stack without breaking its chain',()=>{
 const s=new Simulation(PLAYER_TOY_SETTINGS);s.reset('stack');
 try {
 for(let i=0;i<1200;i++)s.step();s.won=false;s.stableTime=0;
 const p=s.layout.pegs[0];
 const a=s.addRing(p.x-LINKED_RING_SEPARATION/2,p.baseY+3,0,new Quaternion().setFromAxisAngle(new Vector3(1,0,0),Math.PI/4));
 const b=s.addRing(p.x+LINKED_RING_SEPARATION/2,p.baseY+3,0,new Quaternion().setFromAxisAngle(new Vector3(1,0,0),Math.PI*3/4));
 assert.equal(link(a,b),1);
 for(const ring of [a,b])for(const other of s.rings.filter(r=>r!==a&&r!==b))for(let i=0;i<20;i++)for(let j=0;j<20;j++)
  assert.equal(ring.body.collider(i).contactCollider(other.body.collider(j),0),null,'capacity fixture starts clear of the settled stack');
 for(let i=0;i<2400;i++)s.step();
 assert.equal(s.totalRings,14);assert.equal(s.count,14);assert.equal(s.won,true);assert.equal(link(a,b),1);
 }finally{s.dispose();}
});


test('a linked pair is atomic when only half a pose clears, and retry can succeed later',()=>{
 const {session,mascots}=setup(3);const enemy=new VillainEncounterController(session);
 try {
  const s=session.simulation;
  s.rings.forEach((r,i)=>r.body.setTranslation({x:[-3.25,0,3.25][i],y:i===0?3.7:2.5,z:.1},true));
  enemy.requestLinkedPair();assert.equal(enemy.beforeStep()?.reason,'no-safe-space');
  assert.equal(s.rings.length,3);assert.equal(s.totalRings,12);assert.equal(s.collected,9);
  s.rings[0].body.setTranslation({x:-3.25,y:-5.2,z:0},true);
  enemy.requestLinkedPair();assert.equal(enemy.beforeStep()?.spawned.length,2);
  assert.equal(s.rings.length,5);assert.equal(s.totalRings,14);assert.equal(s.collected,9);
 }finally{enemy.dispose();mascots.dispose();session.dispose();}
});


test('the surprise selects a random remaining-count threshold per round, including skipped counts',()=>{
 const session=new GameSession({lab:PLAYER_TOY_SETTINGS});
 try {
  const original=session.snapshot();
  const at=(left:number,t:number)=>({...original,active:left,activeSeconds:t});
  const late=new VillainSchedule(()=>0);
  assert.equal(late.ready(at(5,0),false,false),false);
  assert.equal(late.ready(at(2,20),false,false),false,'target one does not always attack at five');
  assert.equal(late.ready(at(1,21),false,false),false);
  assert.equal(late.ready(at(1,22),false,false),true);
  let draw=0;const skipped=new VillainSchedule(()=>draw++===0?.4:0);
  assert.equal(skipped.ready(at(5,0),false,false),false);
  assert.equal(skipped.ready(at(2,10),false,false),false,'crossing target three starts the wait even if three was skipped');
  assert.equal(skipped.ready(at(2,11),false,false),true);
 }finally{session.dispose();}
});

test('fourteen rings including the real chain remain contained under both pump models and inversion',()=>{
 for(const model of ['single-button','two-button'] as const){
  const session=new GameSession({lab:PLAYER_TOY_SETTINGS,mode:'classic',model}),enemy=new VillainEncounterController(session);
  try {
   enemy.requestLinkedPair();assert.equal(enemy.beforeStep()?.spawned.length,2);
   for(let tick=0;tick<2400;tick++){
    if(tick%90===0){session.dispatch({type:'pump',side:model==='single-button'?'center':tick%180===0?'left':'right'});}
    if(tick%300===0){const angle=tick/300*.9;session.dispatch({type:'orient',gravity:{x:Math.sin(angle)*1.5,y:Math.cos(angle)*3,z:Math.sin(angle*.5)}});}
    session.step();
   }
   assert.equal(session.snapshot().active,14);assert.equal(session.snapshot().total,14);assert.equal(session.snapshot().escaped,false);
  }finally{enemy.dispose();session.dispose();}
 }
});
