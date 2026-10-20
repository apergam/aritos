import {test} from 'node:test';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {initPhysics,Simulation,DT,TANK,RING,PEGS,BASE,TIP,gravityFromOrientation,calibratedGravity} from '../src/physics.ts';
import {Quaternion,Vector3} from 'three';
await initPhysics();
const run=(s:Simulation,seconds:number)=>{for(let i=0;i<seconds/DT;i++)s.step();};
test('Guardar: el aro llega a la base, desaparece y conserva su progreso al bombear e invertir',()=>{
 const s=new Simulation();s.mode='collect';s.reset('drop');
 try{
  run(s,9);assert.equal(s.collected,1);assert.equal(s.totalRings,2);assert.equal(s.rings.length,1);
  assert.equal(s.world.bodies.len(),1);assert.equal(s.won,false);
  s.pump('left');s.pump('right');s.setGravity({x:0,y:3,z:0});run(s,3);
  assert.equal(s.collected,1);assert.equal(s.collected+s.rings.length,s.totalRings);
 }finally{s.dispose();}
});
test('Guardar: estar ensartado sin tocar la base todavía no retira el aro',()=>{
 const s=new Simulation();s.mode='collect';s.setGravity({x:0,y:0,z:0});
 try{
  const ring=s.addRing(PEGS[0].x,BASE+1.5,0);run(s,1);
  assert.equal(s.isThreaded(ring),true);assert.equal(s.collected,0);assert.equal(s.rings.length,1);
 }finally{s.dispose();}
});
test('Guardar: caer al piso o pasar delante de la estaca no otorga progreso',()=>{
 const s=new Simulation();s.mode='collect';s.reset('depth');
 try{
  run(s,9);assert.equal(s.collected,1);assert.equal(s.rings.length,1);
  assert.equal(s.rings[0].id,1);assert.equal(s.isThreaded(s.rings[0]),false);
 }finally{s.dispose();}
});
test('Guardar: completa doce aros, celebra una sola vez y reinicia el progreso',()=>{
 const s=new Simulation();s.mode='collect';s.reset('stack');let wins=0;s.onWin=()=>wins++;
 try{
  run(s,12);assert.equal(s.collected,12);assert.equal(s.rings.length,0);assert.equal(s.world.bodies.len(),0);
  assert.equal(s.totalRings,12);assert.equal(s.won,true);assert.equal(wins,1);
  s.pump('left');run(s,3);assert.equal(wins,1);assert.equal(s.collected,12);
  s.reset('free');assert.equal(s.collected,0);assert.equal(s.rings.length,12);assert.equal(s.totalRings,12);assert.equal(s.won,false);
  s.reset('stack');run(s,12);assert.equal(wins,2);
 }finally{s.dispose();}
});
test('Guardar: una sesión con bombeo e inclinación conserva guardados más activos',()=>{
 const s=new Simulation();s.mode='collect';s.reset('free');let previous=0;
 try{
  for(let i=0;i<60/DT;i++){
   if(i%90===0)s.pump(i%180===0?'left':'right');
   if(i%600===0){const a=i/120*.2;s.setGravity({x:3*Math.sin(a),y:-3*Math.cos(a),z:.4*Math.sin(a)});}
   s.step();assert.equal(s.collected+s.rings.length,12);assert.ok(s.collected>=previous);previous=s.collected;
  }
  assert.equal(s.world.bodies.len(),s.rings.length);assert.equal(s.escaped,false);
 }finally{s.dispose();}
});
test('El agujero permite ensartar; un aro desalineado no cuenta',()=>{
 const s=new Simulation();s.reset('drop');run(s,9);
 assert.equal(s.isThreaded(s.rings[0]),true);assert.equal(s.isThreaded(s.rings[1]),false);assert.equal(s.escaped,false);s.dispose();
});
test('Profundidad: superposición frontal fuera del eje no ensarta',()=>{
 const s=new Simulation();s.reset('depth');run(s,9);assert.equal(s.count,1);assert.equal(s.isThreaded(s.rings[1]),false);s.dispose();
});
test('Depósito poco profundo: un aro horizontal alineado entra desde todo el margen Z disponible',()=>{
 const margin=TANK.z-RING.radius-RING.tube-.02;
 for(const fraction of [-1,-.5,0,.5,1]){
  const s=new Simulation();
  try{
   const z=margin*fraction;
   const ring=s.addRing(PEGS[0].x,3,z);run(s,9);
   assert.equal(s.isThreaded(ring),true,`Un aro alineado cayó por delante/detrás desde Z=${z.toFixed(2)}`);
   assert.equal(s.escaped,false);
  }finally{s.dispose();}
 }
});
test('Las paredes de profundidad contienen los aros al inclinar hacia delante y atrás',()=>{
 for(const direction of [-1,1]){
  const s=new Simulation();
  try{
   const ring=s.addRing(0,3,0);s.setGravity({x:0,y:0,z:3*direction});run(s,4);
   assert.ok(Math.abs(ring.body.translation().z)<=TANK.z-RING.radius-RING.tube+.05);
   assert.equal(s.escaped,false);
  }finally{s.dispose();}
 }
});
test('Todas las escenas nacen con las formas de los aros dentro del fondo físico',()=>{
 const s=new Simulation();
 try{
  for(const scene of ['free','drop','stack','depth'] as const){
   s.reset(scene);
   for(const ring of s.rings){
    const p=ring.body.translation(),r=ring.body.rotation(),q=new Quaternion(r.x,r.y,r.z,r.w);
    for(let i=0;i<RING.segments;i++){
     const a=i*Math.PI*2/RING.segments;
     const endpoint=new Vector3(Math.cos(a)*RING.radius,Math.sin(a)*RING.radius,0).applyQuaternion(q);
     assert.ok(Math.abs(p.z+endpoint.z)+RING.tube<=TANK.z,`${scene}: aro ${ring.id} nace fuera de las paredes`);
    }
   }
  }
 }finally{s.dispose();}
});
test('Doce aros se apilan y salen al invertir sin desaparecer',()=>{
 const s=new Simulation();s.reset('stack');run(s,8);assert.equal(s.count,12);
 assert.equal(s.won,true);s.setGravity({x:0,y:3,z:0});run(s,9);assert.equal(s.count,0);assert.equal(s.rings.length,12);assert.equal(s.escaped,false);s.dispose();
});
test('Bombeo tiene influencia local y puede impulsar aros libres',()=>{
 const s=new Simulation();s.addRing(-2.25,TIP+.8,0);s.addRing(2.25,TIP+.8,0);s.pump('left');run(s,.35);
 assert.ok(s.rings[0].body.translation().y>s.rings[1].body.translation().y+.2);assert.equal(s.pulses.length,0);s.dispose();
});
test('Cada lateral y ambos juntos pueden sacar un aro del centro del piso',()=>{
 for(const side of ['left','right','both'] as const){
  const s=new Simulation();
  try{
   const ring=s.addRing(0,-5.8,0);run(s,1);
   const start={...ring.body.translation()};
   if(side==='both'){s.pump('left');s.pump('right');}else{s.pump(side);}
   run(s,.6);
   const p=ring.body.translation();
   assert.ok(p.y>start.y+.35,`${side}: el aro del centro no se levanta (${(p.y-start.y).toFixed(3)})`);
   if(side!=='both')assert.ok(Math.abs(p.x-start.x)>.12,`${side}: el aro sigue acumulado en el centro`);
   assert.equal(s.pulses.length,0);
  }finally{s.dispose();}
 }
});
test('Los laterales bajos impulsan hacia dentro y arriba; el modelo central también levanta',()=>{
 for(const side of ['left','right','center'] as const){
  const s=new Simulation();
  try{
   const x=side==='center'?0:side==='left'?-3.45:3.45;
   const ring=s.addRing(x,-5,0);s.pump(side);run(s,.12);
   const velocity=ring.body.linvel();
   assert.ok(velocity.y>0);
   if(side!=='center')assert.ok(velocity.x*(side==='left'?1:-1)>0);
  }finally{s.dispose();}
 }
});
test('Gravedad de sensores: ejes, inversión, landscape y calibración',()=>{
 assert.ok(gravityFromOrientation(90,0).distanceTo(new Vector3(0,-1,0))<1e-6);
 assert.ok(gravityFromOrientation(-90,0).distanceTo(new Vector3(0,1,0))<1e-6);
 assert.ok(gravityFromOrientation(0,0).distanceTo(new Vector3(0,0,-1))<1e-6);
 assert.ok(gravityFromOrientation(0,90).distanceTo(new Vector3(1,0,0))<1e-6);
 assert.ok(gravityFromOrientation(90,0,90).distanceTo(new Vector3(-1,0,0))<1e-6);
 const raw=gravityFromOrientation(40,25),q=new Quaternion().setFromUnitVectors(raw,new Vector3(0,-1,0));
 assert.ok(calibratedGravity(raw,q).distanceTo(new Vector3(0,-3,0))<1e-6);
 assert.ok(calibratedGravity(raw.clone().negate(),q).distanceTo(new Vector3(0,3,0))<1e-6);
});
test('10 minutos simulados con bombeos e inclinación: sin escapes ni NaN',()=>{
 const s=new Simulation();s.reset('free');const start=performance.now();let steps=0;
 for(let i=0;i<600/DT;i++){
  if(i%120===0)s.pump(i%240===0?'left':'right');
  if(i%600===0){const a=i/120*.2;s.setGravity({x:3*Math.sin(a),y:-3*Math.cos(a),z:0});}
  s.step();steps++;
 }
 assert.equal(s.escaped,false);assert.equal(s.rings.length,12);
 const ms=performance.now()-start;
 console.log(JSON.stringify({test:'soak',simulatedSeconds:600,wallSeconds:ms/1000,averageStepMs:ms/steps,steps}));s.dispose();
});
