import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initPhysics, Simulation, DT, RING } from '../src/physics.ts';
import { TOY_PHYSICS, TOY_OUTLETS } from '../src/models/toy-model.ts';
import { GameSession } from '../src/game/session.ts';
await initPhysics();
const run=(s:Simulation,seconds:number)=>{for(let i=0;i<seconds/DT;i++)s.step();};

test('lab widths are immutable per instance and baseline geometry stays exact',()=>{
 const base=new Simulation(), narrow=new Simulation({width:7});
 try {
  assert.equal(base.layout.tank.x,4.5);assert.equal(base.layout.tank.z,.9);
  assert.deepEqual(base.layout.pegs.map(p=>[p.x,p.baseY,p.tipY]),[[-1.7,TOY_PHYSICS.base.topY,TOY_PHYSICS.pegTipY],[1.7,TOY_PHYSICS.base.topY,TOY_PHYSICS.pegTipY]]);
  assert.deepEqual(base.layout.jets,TOY_OUTLETS);
  assert.equal(narrow.layout.tank.x,3.5);assert.equal(narrow.layout.jets.left.origin.x,-3.2);
  assert.equal(Object.isFrozen(narrow.layout),true);assert.equal(Object.isFrozen(narrow.layout.pegs[0]),true);
  assert.equal(TOY_PHYSICS.tank.x,4.5);assert.equal(TOY_OUTLETS.left.origin.x,-4.2);
 } finally {base.dispose();narrow.dispose();}
});

test('free spawns fit all widths without ring, wall, shaft, or base overlap',()=>{
 for(const width of [9,8,7] as const){
  const s=new Simulation({width});s.reset('free');
  try {
   assert.equal(s.rings.length,12,`width ${width} free scene must spawn all twelve rings`);
   const extent=RING.radius+RING.tube;
   for(const ring of s.rings){
    const p=ring.body.translation();
    assert.ok(Math.abs(p.x)+extent<=s.layout.tank.x,`width ${width}: x wall clearance`);
    assert.ok(Math.abs(p.y)+extent<=s.layout.tank.y,`width ${width}: floor/ceiling clearance`);
    assert.ok(Math.abs(p.z)+extent<=s.layout.tank.z,`width ${width}: depth wall clearance`);
    for(const peg of s.layout.pegs){
     assert.ok(Math.hypot(p.x-peg.x,p.z-peg.z)>=extent+TOY_PHYSICS.pegRadius,`width ${width}: spawn intersects peg shaft`);
     const baseTop=peg.baseY;
     assert.ok(p.y-extent>=baseTop,`width ${width}: spawn intersects pedestal`);
    }
   }
   for(let i=0;i<s.rings.length;i++)for(let j=i+1;j<s.rings.length;j++){
    const a=s.rings[i].body.translation(),b=s.rings[j].body.translation();
    assert.ok(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)>=2*extent,`width ${width}: initial overlap ${i}/${j}`);
   }
  } finally {s.dispose();}
 }
});

test('side pumping contains rings against both walls at each candidate width',()=>{
 for(const width of [9,8,7] as const)for(const model of ['left','right'] as const){
  const s=new Simulation({width});
  try {const ring=s.addRing(model==='left'?-2:2,0,0);s.pump(model);run(s,4);assert.equal(s.escaped,false);assert.ok(Math.abs(ring.body.translation().x)<=width/2+RING.radius+RING.tube+.02);}
  finally{s.dispose();}
 }
});

test('session lab settings switch on start and persist across restart without lab settings',()=>{
 const session=new GameSession();
 try {
  session.startRound({lab:{width:7}});assert.equal(session.simulation.layout.width,7);
  session.startRound({scene:'depth'});assert.equal(session.simulation.layout.width,7);
  session.startRound({lab:{width:8}});assert.equal(session.simulation.layout.width,8);
 } finally {session.dispose();}
});


test('viable widths retain threading, base collection, classic stack and physical extraction',()=>{
 for(const width of [9,8,7] as const){
  const collect=new Simulation({width});collect.mode='collect';
  try {
   const peg=collect.layout.pegs[0];const ring=collect.addRing(peg.x,peg.baseY+1.5,peg.z);
   collect.setGravity({x:0,y:0,z:0});run(collect,.2);assert.equal(collect.isThreaded(ring),true);
   collect.reset('stack');collect.mode='collect';run(collect,12);
   assert.equal(collect.collected,12,`width ${width} collection stack`);assert.equal(collect.won,true);
  } finally {collect.dispose();}
  const classic=new Simulation({width});classic.mode='classic';classic.reset('stack');
  try {
   run(classic,8);assert.equal(classic.count,12,`width ${width} stack capacity`);
   classic.setGravity({x:0,y:3,z:0});run(classic,9);assert.equal(classic.count,0,`width ${width} physical extraction`);
   assert.equal(classic.rings.length,12);assert.equal(classic.escaped,false);
  } finally {classic.dispose();}
 }
});

test('both toy pump mappings and rule modes stay contained at each width',()=>{
 for(const width of [9,8,7] as const)for(const model of ['single-button','two-button'] as const)for(const mode of ['classic','collect'] as const){
  const session=new GameSession({model,mode,lab:{width}});
  try {session.simulation.addRing(0,0,0);session.dispatch({type:'pump',side:model==='single-button'?'center':'left'});for(let i=0;i<2/DT;i++)session.step();assert.equal(session.simulation.escaped,false);}
  finally {session.dispose();}
 }
});
