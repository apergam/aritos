import RAPIER from '@dimforge/rapier3d-compat';
import {Quaternion,Vector3,Euler} from 'three';
import { TOY_PHYSICS, type PumpSide } from '../models/toy-model';
import { createLabLayout, type LabLayout, type LabSimulationSettings } from '../lab/experiments/geometry';
export type { PumpSide } from '../models/toy-model';

export const DT=1/120;
// Compatibility exports reference the accepted model registry, shared with rendering.
export const TANK=TOY_PHYSICS.tank;
export const RING=TOY_PHYSICS.ring;
export const PEGS=TOY_PHYSICS.pegs;
export const BASE=TOY_PHYSICS.base.topY, TIP=TOY_PHYSICS.pegTipY;
export type Scene='free'|'drop'|'stack'|'depth';
export type GameMode='classic'|'collect';
export type Vec={x:number,y:number,z:number};
export type Ring={body:RAPIER.RigidBody,id:number};
export const PULSE_DURATION=TOY_PHYSICS.pulseDuration;
export const JETS=createLabLayout().jets;
function flowAt(side:PumpSide,p:Vec,layout:LabLayout){
 const jet=layout.jets[side],h=Math.max(0,p.y-jet.origin.y);
 const axisX=jet.origin.x+jet.direction.x/jet.direction.y*h;
 const width=.9+h*.14;
 const core=Math.exp(-.5*((p.x-axisX)/width)**2-h/9);
 // Approximate a short bottom return current: lift resting rings and feed the
 // active side plume rather than leave an unreachable pile between the pegs.
 const sweep=side==='center'?0:.4*Math.exp(-.5*((p.y+layout.tank.y-.6)/1.05)**2-.5*((p.x-jet.origin.x)/4.5)**2);
 const depth=Math.exp(-.5*(p.z/.75)**2);
 return {x:depth*(jet.direction.x*core-Math.sign(jet.direction.x)*sweep*.8),y:depth*(jet.direction.y*core+sweep*.85),z:0};
}
let initialized:Promise<void>|undefined;
export const initPhysics=()=>initialized??=RAPIER.init();
export const horizontal=new Quaternion().setFromEuler(new Euler(Math.PI/2,0,0));
export class Simulation {
 world:RAPIER.World; rings:Ring[]=[]; pulses:{side:PumpSide,left:number}[]=[];
 gravity=new Vector3(0,-3,0); strength:number=TOY_PHYSICS.strength; drag:number=TOY_PHYSICS.drag; time=0; model=2;
 stableTime=0; won=false; onWin?:()=>void; escaped=false;
 mode:GameMode='classic';collected=0;totalRings=0;
 layout:LabLayout;
 private settings:LabSimulationSettings;
 private nextRingId=0;
 private baseColliders:RAPIER.Collider[]=[];
 private baseContactTime=new Map<number,{pegIndex:number;time:number}>();
 constructor(settings:LabSimulationSettings={}){ this.settings=Object.freeze({...settings}); this.layout=createLabLayout(this.settings); this.world=this.createWorld(); }
 private createWorld(){
  const {tank,pegs}=this.layout;
  const world=new RAPIER.World(this.gravity);world.timestep=DT;
  world.numSolverIterations=8;
  this.baseColliders=[];
  const wall=(x:number,y:number,z:number,hx:number,hy:number,hz:number)=>world.createCollider(RAPIER.ColliderDesc.cuboid(hx,hy,hz).setTranslation(x,y,z).setFriction(.3).setRestitution(.02));
  wall(-tank.x-.15,0,0,.15,tank.y+.3,tank.z+.3);wall(tank.x+.15,0,0,.15,tank.y+.3,tank.z+.3);
  wall(0,-tank.y-.15,0,tank.x+.3,.15,tank.z+.3);wall(0,tank.y+.15,0,tank.x+.3,.15,tank.z+.3);
  wall(0,0,-tank.z-.15,tank.x+.3,tank.y+.3,.15);wall(0,0,tank.z+.15,tank.x+.3,tank.y+.3,.15);
  for(const support of this.layout.supports){
   world.createCollider(RAPIER.ColliderDesc.cuboid(support.halfExtents.x,support.halfExtents.y,support.halfExtents.z).setTranslation(support.center.x,support.center.y,support.center.z).setFriction(.3).setRestitution(.02));
  }
  for(const p of pegs){
   this.baseColliders.push(wall(p.x,p.baseY-TOY_PHYSICS.base.footHeight/2,p.z,TOY_PHYSICS.base.halfWidth,TOY_PHYSICS.base.footHeight/2,TOY_PHYSICS.base.halfDepth));
   world.createCollider(RAPIER.ColliderDesc.cylinder((p.tipY-p.baseY)/2,TOY_PHYSICS.pegRadius).setTranslation(p.x,(p.tipY+p.baseY)/2,p.z).setFriction(.2));
  }
  return world;
 }
 addRing(x:number,y:number,z:number,rotation:Quaternion=horizontal){
  const body=this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(x,y,z).setRotation(rotation).setLinearDamping(this.drag).setAngularDamping(1.6).setCcdEnabled(true).setCanSleep(true));
  for(let i=0;i<RING.segments;i++){
   const a=i*Math.PI*2/RING.segments,b=(i+1)*Math.PI*2/RING.segments;
   const start=new Vector3(Math.cos(a)*RING.radius,Math.sin(a)*RING.radius,0);
   const end=new Vector3(Math.cos(b)*RING.radius,Math.sin(b)*RING.radius,0);
   const delta=end.clone().sub(start),mid=start.clone().add(end).multiplyScalar(.5);
   const q=new Quaternion().setFromUnitVectors(new Vector3(0,1,0),delta.clone().normalize());
   this.world.createCollider(RAPIER.ColliderDesc.capsule(delta.length()/2,RING.tube).setTranslation(mid.x,mid.y,mid.z).setRotation(q).setMass(1/RING.segments).setFriction(.18).setRestitution(.015),body);
  }
  const ring={id:this.nextRingId++,body};this.rings.push(ring);this.totalRings++;return ring;
 }
 reset(scene:Scene='free',settings?:LabSimulationSettings){
  if(settings){this.settings=Object.freeze({...settings});this.layout=createLabLayout(this.settings);}
  // Rebuild the world at a round boundary: removing bodies alone leaves Rapier
  // broad/narrow-phase history that changes an identical restarted stack.
  const previous=this.world;this.world=this.createWorld();previous.free();
  this.rings=[];this.pulses=[];this.time=0;this.stableTime=0;this.won=false;this.escaped=false;
  this.collected=0;this.totalRings=0;this.nextRingId=0;this.baseContactTime.clear();
  this.setGravity({x:0,y:-3,z:0});
  if(scene==='drop'){
   this.addRing(-1.7,3,0);this.addRing(2.65,3,0);
  }else if(scene==='stack'){
   for(let i=0;i<this.layout.ringCount;i++){const peg=this.layout.pegs[i%this.layout.pegs.length];this.addRing(peg.x,peg.baseY+.6+Math.floor(i/this.layout.pegs.length)*.55,peg.z);}
  }else if(scene==='depth'){
   // The upright ring fits in the shallower tank and passes in front of the peg.
   // Its screen overlap must still never grant threading progress.
   this.addRing(-1.7,3,0);this.addRing(1.7,3,.55,new Quaternion());
  }else{
   // Start clear of the floor-mounted pedestals and shafts, including tilted rings.
   const narrow=this.layout.width<9;
   const raised=this.layout.pegLayout==='raised';
   const columns=raised?[-3.8,0,3.8]:(narrow?[-2.1,0,2.1]:[-3.8,-2.5,-.675,.675,2.5,3.8]);
   const rowWidth=raised||narrow?3:6;
   const rows=raised?[-5,-2.5,.5,4]:undefined;
   for(let i=0;i<this.layout.ringCount;i++){
    const x=columns[i%rowWidth],y=rows?rows[Math.floor(i/rowWidth)]:-4.7+Math.floor(i/rowWidth)*1.4,z=((i%3)-1)*.24;
    const q=new Quaternion().setFromEuler(new Euler(.2*(i%3),.24*(i%2),i*.73));
    this.addRing(x,y,z,q);
   }
  }
 }
 setGravity(g:Vec){
  this.gravity.copy(g);this.world.gravity={...g};
  for(const r of this.rings)r.body.wakeUp();
 }
 pump(side:PumpSide){
  this.pulses.push({side,left:PULSE_DURATION});
 }
 isThreaded(ring:Ring){return this.threadedPegIndex(ring)!==undefined;}
 private threadedPegIndex(ring:Ring):number|undefined{
  const p=ring.body.translation(),q=ring.body.rotation();
  const n=new Vector3(0,0,1).applyQuaternion(new Quaternion(q.x,q.y,q.z,q.w));
  if(Math.abs(n.y)<.3)return undefined;
  for(let index=0;index<this.layout.pegs.length;index++){
   const peg=this.layout.pegs[index];
   const dy=-(n.x*(peg.x-p.x)+n.z*(peg.z-p.z))/n.y;
   const axisY=p.y+dy;
   if(axisY>peg.baseY+.02&&axisY<peg.tipY-.14&&Math.hypot(peg.x-p.x,dy,peg.z-p.z)<RING.radius-RING.tube-TOY_PHYSICS.pegRadius-.015)return index;
  }
  return undefined;
 }
 get count(){return this.rings.filter(r=>this.isThreaded(r)).length;}
 private touchesBase(ring:Ring,pegIndex:number){
  let touching=false;
  const base=this.baseColliders[pegIndex];
  if(!base)return false;
  for(let i=0;i<ring.body.numColliders()&&!touching;i++){
   this.world.contactPair(ring.body.collider(i),base,manifold=>{
    for(let j=0;j<manifold.numContacts();j++)if(manifold.contactDist(j)<=.01)touching=true;
   });
  }
  return touching;
 }
 private collectAtBase(){
  const remaining:Ring[]=[];
  for(const ring of this.rings){
   // Threading and contact must refer to the same physical peg/base pair.
   const pegIndex=this.threadedPegIndex(ring);
   const peg=pegIndex===undefined?undefined:this.layout.pegs[pegIndex];
   const eligible=pegIndex!==undefined&&peg!==undefined&&ring.body.translation().y<peg.baseY+RING.radius+RING.tube+.1&&this.touchesBase(ring,pegIndex);
   const prior=this.baseContactTime.get(ring.id);
   const contactTime=eligible?(prior?.pegIndex===pegIndex?prior.time:0)+DT:0;
   if(contactTime>=.12){
    this.world.removeRigidBody(ring.body);this.collected++;this.baseContactTime.delete(ring.id);
   }else{
    if(eligible&&pegIndex!==undefined)this.baseContactTime.set(ring.id,{pegIndex,time:contactTime});else this.baseContactTime.delete(ring.id);
    remaining.push(ring);
   }
  }
  this.rings=remaining;
 }
 step(){
  for(const ring of this.rings){
   const b=ring.body,p=b.translation();b.setLinearDamping(this.drag);
   for(const pulse of this.pulses){
    const flow=flowAt(pulse.side,p,this.layout);
    const shelter=this.isThreaded(ring)?.30:1;
    const impulse=this.strength*DT*shelter;
    const localImpulse=impulse*Math.hypot(flow.x,flow.y);
    if(localImpulse>.00002){
     b.applyImpulse({x:flow.x*impulse,y:flow.y*impulse,z:Math.sin(this.time*4+ring.id)*localImpulse*.09},true);
     b.applyTorqueImpulse({x:Math.sin(ring.id*2+this.time)*localImpulse*.032,y:Math.cos(ring.id+this.time)*localImpulse*.012,z:Math.cos(ring.id*3+this.time)*localImpulse*.025},true);
    }
   }
  }
  this.world.step();this.time+=DT;
  for(const pulse of this.pulses)pulse.left-=DT;
  this.pulses=this.pulses.filter(p=>p.left>0);
  if(this.mode==='collect')this.collectAtBase();
  const complete=this.totalRings>0&&(this.mode==='collect'?this.collected===this.totalRings:this.count===this.totalRings);
  this.stableTime=complete?this.stableTime+DT:0;
  if(!this.won&&complete&&(this.mode==='collect'||this.stableTime>=2)){this.won=true;this.onWin?.();}
  for(const r of this.rings){const p=r.body.translation();if(!Number.isFinite(p.x+p.y+p.z)||Math.abs(p.x)>this.layout.tank.x+.2||Math.abs(p.y)>this.layout.tank.y+.2||Math.abs(p.z)>this.layout.tank.z+.2)this.escaped=true;}
 }
 dispose(){this.world.free();}
}

/** Device gravity from W3C Z-X-Y orientation, re-expressed in screen axes. */
export function gravityFromOrientation(beta:number,gamma:number,screenAngle=0){
 const b=beta*Math.PI/180,c=gamma*Math.PI/180,s=screenAngle*Math.PI/180;
 const x=Math.cos(b)*Math.sin(c),y=-Math.sin(b),z=-Math.cos(b)*Math.cos(c);
 return new Vector3(x*Math.cos(s)+y*Math.sin(s),-x*Math.sin(s)+y*Math.cos(s),z).normalize();
}
export function calibratedGravity(raw:Vector3,calibration:Quaternion,magnitude=3){return raw.clone().applyQuaternion(calibration).multiplyScalar(magnitude);}
