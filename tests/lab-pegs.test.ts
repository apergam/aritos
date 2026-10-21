import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initPhysics, Simulation, DT, RING } from '../src/physics.ts';
import { TOY_PHYSICS } from '../src/models/toy-model.ts';
import { GameSession } from '../src/game/session.ts';
await initPhysics();
const run=(s:Simulation,seconds:number)=>{for(let i=0;i<seconds/DT;i++)s.step();};

const raised={pegLayout:'raised' as const};

test('raised layout has explicit offset bases, full-length pegs, and attached rear supports',()=>{
 const s=new Simulation(raised),floor=new Simulation();
 try {
  assert.deepEqual(s.layout.pegs.map(p=>[p.x,p.baseY]),[[-1.7,-3.8],[1.7,-2.2]]);
  assert.ok(Math.abs(s.layout.pegs[0].tipY-.55)<1e-12);assert.ok(Math.abs(s.layout.pegs[1].tipY-2.15)<1e-12);
  assert.equal(s.layout.supports.length,2);
  for(let i=0;i<2;i++){
   const peg=s.layout.pegs[i],support=s.layout.supports[i];
   assert.equal(peg.tipY-peg.baseY,TOY_PHYSICS.pegTipY-TOY_PHYSICS.base.topY);
   assert.equal(support.center.x,peg.x);
   assert.ok(support.center.z+support.halfExtents.z>=-s.layout.tank.z);
   assert.ok(support.center.z-support.halfExtents.z < -s.layout.tank.z,'support penetrates the rear plastic for a fixed attachment');
   assert.ok(support.center.z+support.halfExtents.z < -RING.radius-RING.tube,'support stays behind the maximum-depth ring envelope');
  }
  assert.deepEqual(floor.layout.supports,[]);
 } finally {s.dispose();floor.dispose();}
});

test('raised free-play rings spawn inside the tank and outside the threaded peg region',()=>{
 const s=new Simulation(raised);s.reset('free');
 try {
  assert.equal(s.rings.length,12);
  const separatedFromBox=(p:{x:number;y:number;z:number},box:{center:{x:number;y:number;z:number};halfExtents:{x:number;y:number;z:number}})=>{
   const dx=Math.max(0,Math.abs(p.x-box.center.x)-box.halfExtents.x);
   const dy=Math.max(0,Math.abs(p.y-box.center.y)-box.halfExtents.y);
   const dz=Math.max(0,Math.abs(p.z-box.center.z)-box.halfExtents.z);
   return Math.hypot(dx,dy,dz)>RING.radius+RING.tube;
  };
  for(const ring of s.rings){
   const p=ring.body.translation();
   assert.ok(Math.abs(p.x)+RING.radius+RING.tube<=s.layout.tank.x);
   assert.ok(Math.abs(p.y)+RING.radius+RING.tube<=s.layout.tank.y);
   assert.ok(Math.abs(p.z)+RING.radius+RING.tube<=s.layout.tank.z);
   assert.equal(s.isThreaded(ring),false);
   for(const support of s.layout.supports)assert.ok(separatedFromBox(p,support),'initial ring overlaps a rear support');
   for(const peg of s.layout.pegs){
    const base={center:{x:peg.x,y:peg.baseY-TOY_PHYSICS.base.footHeight/2,z:peg.z},halfExtents:{x:TOY_PHYSICS.base.halfWidth,y:TOY_PHYSICS.base.footHeight/2,z:TOY_PHYSICS.base.halfDepth}};
    assert.ok(separatedFromBox(p,base),'initial ring overlaps a pedestal');
   }
  }
  run(s,1);assert.equal(s.escaped,false);
 } finally {s.dispose();}
});

test('aligned drops thread and collect at each raised base after real contact',()=>{
 for(let pegIndex=0;pegIndex<2;pegIndex++){
  const s=new Simulation(raised);s.mode='collect';
  try {
   const peg=s.layout.pegs[pegIndex],ring=s.addRing(peg.x,5,0);
   run(s,9);
   assert.equal(s.collected,1,`peg ${pegIndex}: no base collection`);
   assert.equal(s.rings.length,0);assert.equal(s.won,true);assert.equal(s.escaped,false);
   assert.equal(ring.body.isValid(),false);
  } finally {s.dispose();}
 }
});

test('offset and depth-misaligned rings do not earn raised-base progress',()=>{
 const s=new Simulation(raised);s.mode='collect';
 try {
  const left=s.layout.pegs[0];
  const offset=s.addRing(left.x+.82,5,0);
  const depth=s.addRing(s.layout.pegs[1].x,5,.72);
  run(s,8);
  assert.equal(s.collected,0);assert.equal(s.rings.length,2);
  assert.equal(s.isThreaded(offset),false);assert.equal(s.isThreaded(depth),false);
  assert.equal(s.won,false);
 } finally {s.dispose();}
});

test('floor or rear support contact cannot substitute for same-peg base contact',()=>{
 const s=new Simulation(raised);s.mode='collect';
 try {
  s.addRing(0,-5.8,0);
  const support=s.layout.supports[0];
  const supportRing=s.addRing(support.center.x,support.center.y,-.12);
  assert.equal(s.isThreaded(supportRing),true);
  s.step();
  const supportCollider=s.world.colliders.getAll().find(c=>{
   const p=c.translation(),shape=c.halfExtents?.();
   return !c.parent()&&shape!==undefined&&Math.abs(p.x-support.center.x)<.001&&Math.abs(p.y-support.center.y)<.001&&Math.abs(p.z-support.center.z)<.001;
  });
  assert.ok(supportCollider,'rear support collider exists');
  let touching=false;
  for(let i=0;i<supportRing.body.numColliders()&&!touching;i++)s.world.contactPair(supportRing.body.collider(i),supportCollider!,manifold=>{if(manifold.numContacts()>0)touching=true;});
  assert.equal(touching,true,'ring should physically touch the rear support');
  run(s,.5);
  assert.equal(s.collected,0);assert.equal(s.isThreaded(supportRing),true);
  assert.equal(s.won,false);
 } finally {s.dispose();}
});

test('raised bases hold twelve classic rings and allow physical inversion extraction',()=>{
 const s=new Simulation(raised);s.mode='classic';s.reset('stack');
 try {
  run(s,9);assert.equal(s.count,12);assert.equal(s.won,true);
  s.setGravity({x:0,y:3,z:0});run(s,10);
  assert.equal(s.count,0);assert.equal(s.rings.length,12);assert.equal(s.escaped,false);
 } finally {s.dispose();}
});

test('raised layout remains accessible and contained with both pump model mappings and rule modes',()=>{
 for(const model of ['single-button','two-button'] as const)for(const mode of ['classic','collect'] as const){
  const session=new GameSession({model,mode,lab:raised});
  try {
   session.simulation.addRing(0,0,0);
   session.dispatch({type:'pump',side:model==='single-button'?'center':'left'});
   for(let i=0;i<2/DT;i++)session.step();
   assert.equal(session.simulation.escaped,false);
  } finally {session.dispose();}
 }
});
