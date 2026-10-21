/** Standalone investigation, not a game fix or an acceptance test. Run with node --import tsx. */
import {Simulation,initPhysics,RING,type Vec}from'../../../src/physics.ts';
import{PLAYER_TOY_SETTINGS}from'../../../src/models/selected-toy.ts';
import{Quaternion,Vector3}from'three';import{ringData,linking}from'./link-math';import{readFileSync}from'node:fs';
import assert from 'node:assert/strict';
type Pose={p:Vec;q:{x:number;y:number;z:number;w:number};v:Vec;w:Vec};
await initPhysics();const fixture=JSON.parse(readFileSync(new URL('./fixture.json',import.meta.url),'utf8')) as {initial:Pose[];poses:Pose[]};
// Validate geometric classification independently of the reproduced collision.
{
 const s=new Simulation();
 try {
  const a=s.addRing(0,2,0,new Quaternion());
  const b=s.addRing(RING.radius,2,0,new Quaternion().setFromAxisAngle(new Vector3(1,0,0),Math.PI/2));
  assert.equal(Math.abs(linking(ringData(a),ringData(b))),1);
  b.body.setTranslation({x:2,y:2,z:0},true);assert.equal(linking(ringData(a),ringData(b)),0);
  b.body.setTranslation({x:0,y:2,z:.5},true);b.body.setRotation(new Quaternion(),true);assert.equal(linking(ringData(a),ringData(b)),0);
 } finally {s.dispose();}
}
const configs=[{name:'baseline',speed:1,step:1/120,ccd:1},{name:'half-speed',speed:.5,step:1/120,ccd:1},{name:'quarter-speed',speed:.25,step:1/120,ccd:1},{name:'240Hz',speed:1,step:1/240,ccd:1},{name:'480Hz',speed:1,step:1/480,ccd:1},{name:'ccd4',speed:1,step:1/120,ccd:4},{name:'ccd8',speed:1,step:1/120,ccd:8}];
const results=[];
for(const cfg of configs){
 const s=new Simulation(PLAYER_TOY_SETTINGS);s.setGravity({x:0,y:0,z:0});s.world.timestep=cfg.step;s.world.integrationParameters.maxCcdSubsteps=cfg.ccd;
 try{
 const rs=fixture.initial.map((p:Pose)=>{const r=s.addRing(p.p.x,p.p.y,p.p.z,new Quaternion(p.q.x,p.q.y,p.q.z,p.q.w));r.body.setLinvel(new Vector3().copy(p.v).multiplyScalar(cfg.speed),true);r.body.setAngvel(p.w,true);return r;});
 let minSeparation=Infinity;
 for(let i=0;i<20;i++)for(let j=0;j<20;j++){const hit=rs[0].body.collider(i).contactCollider(rs[1].body.collider(j),10);if(hit)minSeparation=Math.min(minSeparation,hit.distance);}
 let first:number|null=null,linkedTicks=0,lastLink=0;
 for(let t=0;t<Math.round(2/cfg.step);t++){s.step();lastLink=linking(ringData(rs[0]),ringData(rs[1]));if(lastLink){if(first===null)first=t+1;linkedTicks++;}}
 const result={...cfg,initialMinSeparation:minSeparation,firstLinkedTick:first,firstLinkedSeconds:first===null?null:first*cfg.step,linkedSeconds:linkedTicks*cfg.step,linkAt2Seconds:lastLink};results.push(result);console.log(JSON.stringify(result));
 if(cfg.name==='baseline'&&process.argv.includes('--assert-unlinked'))assert.equal(first,null,'Initially separate rings formed a chain during a dynamic collision');
 }finally{s.dispose();}
}
// Report only: this diagnostic intentionally observes the current emergent behavior.
assert.equal(results[0].linkAt2Seconds,-1);
for(const result of results.slice(1))assert.equal(result.linkAt2Seconds,0);
// Isolate a freely linked pair away from walls/pegs, apply force only to A.
const s=new Simulation(PLAYER_TOY_SETTINGS);s.setGravity({x:0,y:0,z:0});
const rs=fixture.poses.map((p:Pose)=>{const r=s.addRing(p.p.x-.9,p.p.y+1,p.p.z,new Quaternion(p.q.x,p.q.y,p.q.z,p.q.w));return r;});
const initial=rs.map(r=>({...r.body.translation()}));let survived=0;
for(let t=0;t<240;t++){if(t<120)rs[0].body.applyImpulse({x:0,y:.02,z:0},true);s.step();if(linking(ringData(rs[0]),ringData(rs[1])))survived++;}
const end=rs.map(r=>({...r.body.translation()}));const linked=linking(ringData(rs[0]),ringData(rs[1]));
const pull={initial,end,linked,survivedSeconds:survived/120};assert.equal(Math.abs(linked),1);
assert.ok(end[1].y-initial[1].y>1,'Contact with A must carry the unforced B ring');
console.log(JSON.stringify({pull,joints:s.world.impulseJoints.len(),multibodyJoints:s.world.multibodyJoints.len()}));
s.world.removeRigidBody(rs[0].body);s.rings=s.rings.filter(r=>r!==rs[0]);
for(let t=0;t<60;t++)s.step();
console.log(JSON.stringify({afterRemoval:{bodies:s.world.bodies.len(),survivorValid:rs[1].body.isValid(),survivorPosition:rs[1].body.translation()}}));s.dispose();
