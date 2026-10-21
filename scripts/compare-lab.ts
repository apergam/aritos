import {initPhysics,Simulation,DT} from '../src/physics';
await initPhysics();
const results=[];
for(const width of [9,8,7]as const)for(const model of [1,2])for(const mode of ['classic','collect']as const){
 const s=new Simulation({width});s.reset('free');s.model=model;s.mode=mode;
 // Same clear 3-column fixture in every width, isolating width from initial scatter.
 s.rings.forEach((ring,index)=>ring.body.setTranslation({x:[-2.8,0,2.8][index%3],y:-4.7+Math.floor(index/3)*1.4,z:((index%3)-1)*.24},true));
 const previous=new Map(s.rings.map(r=>[r.id,{...r.body.translation()}]));let travel=0,idle=0,samples=0;
 const started=performance.now();
 for(let tick=0;tick<2400;tick++){
  if(tick%60===0)s.pump(model===1?'center':tick%120===0?'left':'right');
  if(tick%120===0){const t=tick*DT;s.setGravity({x:Math.sin(t*.4)*.8,y:-3,z:Math.sin(t*.3)*.15});}
  s.step();for(const ring of s.rings){const p=ring.body.translation(),old=previous.get(ring.id)!;travel+=Math.hypot(p.x-old.x,p.y-old.y,p.z-old.z);previous.set(ring.id,{...p});const v=ring.body.linvel();if(Math.hypot(v.x,v.y,v.z)<.05)idle++;samples++;}
 }
 results.push({width,model,mode,seconds:20,pulses:40,travelPerStartingRing:+(travel/12).toFixed(3),idleBodySamplesPercent:+(idle/samples*100).toFixed(2),collected:s.collected,active:s.rings.length,escaped:s.escaped,engineStepMs:+((performance.now()-started)/2400).toFixed(4)});s.dispose();
}
process.stdout.write(JSON.stringify({fixture:'Common 12-ring scatter: x -2.8/0/2.8, four rows; one pulse every .5 s; same sinusoidal tilt; engine-only timing, not FPS or enjoyment.',results},null,2)+'\n');
