import * as THREE from 'three';
import {Simulation,initPhysics,DT,TANK,RING,PEGS,BASE,TIP,JETS,PULSE_DURATION,gravityFromOrientation,calibratedGravity,type Scene,type GameMode} from './physics';

const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const viewport=$('viewport');
async function start(){
 await initPhysics();
 const sim=new Simulation();sim.mode='collect';sim.reset();
 $('depth-readout').textContent=`FONDO ${(2*TANK.z).toFixed(1)} · ARO ${(2*(RING.radius+RING.tube)).toFixed(1)}`;
 const scene=new THREE.Scene();
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.setClearColor(0x000000,0);
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;
 viewport.prepend(renderer.domElement);renderer.domElement.setAttribute('aria-label','Depósito 3D con aros y dos estacas');
 const camera=new THREE.PerspectiveCamera(37,1,.1,100);
 // POC-only camera controls. Angles and distance scale can become a fixed default later.
 const cameraDefaults={azimuth:0,elevation:.7,distanceScale:1,targetY:0};
 const cameraSettings={...cameraDefaults};
 let cameraFitDistance=25;
 const cameraSnapshot=()=>({
  ...cameraSettings,
  position:{x:camera.position.x,y:camera.position.y,z:camera.position.z},
  target:{x:0,y:cameraSettings.targetY,z:0},
  distance:cameraFitDistance*cameraSettings.distanceScale,
  fov:camera.fov,aspect:camera.aspect,
 });
 function updateCamera(){
  const azimuth=THREE.MathUtils.degToRad(cameraSettings.azimuth);
  const elevation=THREE.MathUtils.degToRad(cameraSettings.elevation);
  const distance=cameraFitDistance*cameraSettings.distanceScale;
  camera.position.set(distance*Math.cos(elevation)*Math.sin(azimuth),cameraSettings.targetY+distance*Math.sin(elevation),distance*Math.cos(elevation)*Math.cos(azimuth));
  camera.lookAt(0,cameraSettings.targetY,0);
  for(const name of ['azimuth','elevation','distanceScale','targetY'] as const){
   $<HTMLInputElement>('camera-'+name).value=String(cameraSettings[name]);
   $('camera-'+name+'-value').textContent=name==='distanceScale'?cameraSettings[name].toFixed(2)+'×':name==='targetY'?cameraSettings[name].toFixed(1):cameraSettings[name].toFixed(1)+'°';
  }
  $('camera-position').textContent=`X ${camera.position.x.toFixed(2)} · Y ${camera.position.y.toFixed(2)} · Z ${camera.position.z.toFixed(2)}`;
  $('camera-target').textContent=`Mira: (0, ${cameraSettings.targetY.toFixed(1)}, 0) · Distancia: ${distance.toFixed(2)}`;
  $<HTMLTextAreaElement>('camera-config').value=JSON.stringify(cameraSnapshot(),null,2);
  $('camera-copy-status').textContent='';
 }
 for(const name of ['azimuth','elevation','distanceScale','targetY'] as const)$<HTMLInputElement>('camera-'+name).oninput=()=>{
  cameraSettings[name]=Number($<HTMLInputElement>('camera-'+name).value);updateCamera();
 };
 $('camera-reset').onclick=()=>{Object.assign(cameraSettings,cameraDefaults);updateCamera();};
 $('camera-elevated').onclick=()=>{Object.assign(cameraSettings,cameraDefaults,{elevation:15});updateCamera();};
 $('camera-copy').onclick=async()=>{
  const config=$<HTMLTextAreaElement>('camera-config');
  try{await navigator.clipboard.writeText(config.value);$('camera-copy-status').textContent='Configuración copiada.';}
  catch{config.closest('details')!.open=true;config.focus();config.select();$('camera-copy-status').textContent='Seleccionamos los valores. Usa Copiar en tu dispositivo.';}
 };
 scene.add(new THREE.AmbientLight(0xffffff,2.2));
 const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(-4,10,12);scene.add(light);
 const fill=new THREE.DirectionalLight(0x91d9c6,1.5);fill.position.set(5,-2,-3);scene.add(fill);
 function mesh(g:THREE.BufferGeometry,color:number,position:THREE.Vector3,opacity=1){const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color,roughness:.34,metalness:.1,transparent:opacity<1,opacity,depthWrite:opacity>=1}));m.position.copy(position);scene.add(m);return m;}
 const v=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
 mesh(new THREE.BoxGeometry(9.55,12.5,.28),0x8ab8a6,v(0,0,-TANK.z-.25));
 mesh(new THREE.PlaneGeometry(8.95,11.95),0xd4e9dc,v(0,0,-TANK.z-.08));
 // Understated backing grid makes front/back motion easier to see.
 const gridPositions:number[]=[];
 for(let x=-4;x<=4;x+=1)gridPositions.push(x,-5.9,-TANK.z-.05,x,5.9,-TANK.z-.05);
 for(let y=-5;y<=5;y+=1)gridPositions.push(-4.4,y,-TANK.z-.05,4.4,y,-TANK.z-.05);
 const gridGeometry=new THREE.BufferGeometry();gridGeometry.setAttribute('position',new THREE.Float32BufferAttribute(gridPositions,3));scene.add(new THREE.LineSegments(gridGeometry,new THREE.LineBasicMaterial({color:0xa7c8b4,transparent:true,opacity:.28})));
 const frameColor=0x6b9d87;
 for(const x of [-4.65,4.65])mesh(new THREE.BoxGeometry(.3,12.55,2*(TANK.z+.25)),frameColor,v(x,0,0),.35);
 for(const y of [-6.15,6.15])mesh(new THREE.BoxGeometry(9.5,.3,2*(TANK.z+.25)),frameColor,v(0,y,0),.38);
 const edges=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(9.3,12.3,2*(TANK.z+.15))),new THREE.LineBasicMaterial({color:0x447d65,transparent:true,opacity:.52}));scene.add(edges);
 for(const p of PEGS){
  mesh(new THREE.CylinderGeometry(.79,.86,.3,32),0x739f87,v(p.x,BASE-.15,p.z));
  mesh(new THREE.CylinderGeometry(.11,.11,TIP-BASE,24),0xe2c789,v(p.x,(TIP+BASE)/2,p.z));
  mesh(new THREE.SphereGeometry(.11,16,8),0xf4db9c,v(p.x,TIP,p.z));
 }
 const outlets=Object.entries(JETS).map(([side,jet])=>{
  const outlet=mesh(new THREE.CylinderGeometry(.13,.18,.42,16),0x458a89,v(jet.origin.x,jet.origin.y,jet.origin.z));
  outlet.quaternion.setFromUnitVectors(v(0,1,0),v(jet.direction.x,jet.direction.y,jet.direction.z));
  return {side,outlet};
 });
 function updateOutlets(){for(const {side,outlet} of outlets)outlet.visible=sim.model===1?side==='center':side!=='center';}
 updateOutlets();
 const front=mesh(new THREE.PlaneGeometry(9,12),0xd6fff1,v(0,0,TANK.z+.01),.035);front.renderOrder=10;
 const palette=[0xf09c7a,0xe5c16a,0x759fb9,0x9c8ca7,0x72b9a2,0xe2b4bb];
 const ringGeometry=new THREE.TorusGeometry(RING.radius,RING.tube,12,36);
 const ringMeshes=new Map<number,THREE.Mesh<THREE.TorusGeometry,THREE.MeshStandardMaterial>>();
 function syncMeshes(){
  const activeIds=new Set(sim.rings.map(r=>r.id));
  for(const [id,m] of ringMeshes)if(!activeIds.has(id)){scene.remove(m);m.material.dispose();ringMeshes.delete(id);}
  for(const r of sim.rings)if(!ringMeshes.has(r.id)){
   const m=new THREE.Mesh(ringGeometry,new THREE.MeshStandardMaterial({color:palette[r.id%palette.length],roughness:.29,metalness:.04}));
   scene.add(m);ringMeshes.set(r.id,m);
  }
 }
 syncMeshes();
 const jets=new THREE.Group();scene.add(jets);
 const bubbleG=new THREE.SphereGeometry(.045,7,5),bubbleM=new THREE.MeshBasicMaterial({color:0xf0fff7,transparent:true,opacity:.65});
 const bubbles=Array.from({length:36},()=>{const m=new THREE.Mesh(bubbleG,bubbleM);jets.add(m);return m;});
 const debugGeo=new THREE.BufferGeometry(),debugLines=new THREE.LineSegments(debugGeo,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.7,depthTest:false}));debugLines.renderOrder=20;scene.add(debugLines);
 const gravityArrow=new THREE.ArrowHelper(v(0,-1,0),v(3.65,4.8,.9),.75,0x477b60,.2,.13);scene.add(gravityArrow);
 let activeScene:Scene='free',paused=false,manualRoll=0,manualPitch=0;
 let lastCollected=0,collectionFeedbackTimer:ReturnType<typeof setTimeout>|undefined,winTimer:ReturnType<typeof setTimeout>|undefined;
 let sensorMode=false,rawGravity:THREE.Vector3|null=null,calibration=new THREE.Quaternion(),haveSensor=false;
 let sensorTimer:ReturnType<typeof setTimeout>|undefined;
 let targetGravity=v(0,-3,0),smoothGravity=targetGravity.clone(),accumulator=0,last=performance.now(),frameCount=0,fpsStart=last,frameTimes:number[]=[];
 let renderFps=0,maxPhysicsMs=0,stepSamples:number[]=[];
 const keys=new Set<string>();
 function updateManual(){
  sensorMode=false;
  const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(manualPitch*Math.PI/180,0,manualRoll*Math.PI/180,'XYZ'));
  targetGravity.set(0,-3,0).applyQuaternion(q);
  $('roll-value').textContent=Math.round(manualRoll)+'°';$('pitch-value').textContent=Math.round(manualPitch)+'°';
  $<HTMLInputElement>('roll').value=String(manualRoll);$<HTMLInputElement>('pitch').value=String(manualPitch);
  $('sensor').textContent=haveSensor?'Usar movimiento':'Usar movimiento';
  $('sensor-status').textContent='Control manual activo. Flechas: de lado · W/S: profundidad.';
 }
 function onOrientation(e:DeviceOrientationEvent){
  if(e.beta===null||e.gamma===null||!Number.isFinite(e.beta+e.gamma))return;
  rawGravity=gravityFromOrientation(e.beta,e.gamma,screen.orientation?.angle??Number((window as unknown as {orientation?:number}).orientation??0));
  if(sensorMode){
   if(!haveSensor){calibration.setFromUnitVectors(rawGravity,v(0,-1,0));haveSensor=true;}
   clearTimeout(sensorTimer);$('sensor-status').textContent='Movimiento activo. Centrar ajusta tu postura de referencia.';$('sensor').textContent='Movimiento activo ✓';
   targetGravity=calibratedGravity(rawGravity,calibration);
  }
 }
 window.addEventListener('deviceorientation',onOrientation);
 $('sensor').onclick=async()=>{
  const C=window.DeviceOrientationEvent as typeof DeviceOrientationEvent&{requestPermission?:()=>Promise<string>};
  try{
   if(!C){$('sensor-status').textContent='Sin sensores disponibles. Usa los controles manuales.';return;}
   if(C.requestPermission&&await C.requestPermission()!=='granted'){$('sensor-status').textContent='Permiso no autorizado. Puedes seguir con los controles manuales.';return;}
   sensorMode=true;haveSensor=false;$('sensor-status').textContent='Esperando movimiento del dispositivo…';
   if(rawGravity){calibration.setFromUnitVectors(rawGravity,v(0,-1,0));}
   clearTimeout(sensorTimer);sensorTimer=setTimeout(()=>{if(!haveSensor){sensorMode=false;$('sensor-status').textContent='No llegaron datos de movimiento. El control manual sigue disponible.';}},3000);
  }catch{$('sensor-status').textContent='No fue posible activar movimiento. Usa los controles manuales.';sensorMode=false;}
 };
 function center(){
  if(sensorMode&&rawGravity){calibration.setFromUnitVectors(rawGravity,v(0,-1,0));targetGravity.set(0,-3,0);}
  else{manualRoll=0;manualPitch=0;updateManual();}
 }
 $('upright').onclick=center;
 $('invert').onclick=()=>{manualRoll=180;manualPitch=0;updateManual();};
 for(const name of ['roll','pitch'] as const)$<HTMLInputElement>(name).oninput=()=>{manualRoll=Number($<HTMLInputElement>('roll').value);manualPitch=Number($<HTMLInputElement>('pitch').value);updateManual();};
 function pulse(side:'left'|'right'|'center'){
  if(paused||document.hidden)return;
  sim.pump(side);const el=$('pump-'+side);el.classList.add('pressed');setTimeout(()=>el.classList.remove('pressed'),130);
 }
 for(const side of ['left','right','center'] as const)$('pump-'+side).addEventListener('pointerdown',e=>{e.preventDefault();pulse(side);});
 function reset(sc:Scene=activeScene){
  activeScene=sc;sim.reset(sc);syncMeshes();center();smoothGravity.copy(targetGravity);accumulator=0;$('win').hidden=true;
  clearTimeout(winTimer);clearTimeout(collectionFeedbackTimer);lastCollected=0;$('collected-feedback').hidden=true;
  $('count-label').textContent=sim.mode==='collect'?'GUARDADOS':'ENSARTADOS';
  $('count').textContent='0 / '+sim.totalRings;
  const labels={free:'01 / JUEGO LIBRE',drop:'02 / CAÍDA Y CHOQUE',stack:'03 / APILAR Y EXTRAER',depth:'04 / PROFUNDIDAD'};
  $('scene-label').textContent=labels[sc];document.querySelectorAll<HTMLButtonElement>('[data-scene]').forEach(b=>b.classList.toggle('active',b.dataset.scene===sc));
 }
 document.querySelectorAll<HTMLButtonElement>('[data-scene]').forEach(b=>b.onclick=()=>reset(b.dataset.scene as Scene));
 $('reset').onclick=()=>reset();
 $<HTMLSelectElement>('model').onchange=()=>{
  sim.model=Number($<HTMLSelectElement>('model').value);updateOutlets();
  $('pump-center').hidden=sim.model!==1;$('pump-left').hidden=sim.model===1;$('pump-right').hidden=sim.model===1;reset();
 };
 $<HTMLSelectElement>('game-mode').onchange=()=>{
  sim.mode=$<HTMLSelectElement>('game-mode').value as GameMode;reset();
  $('mode-hint').textContent=sim.mode==='collect'?'Al llegar a la base, el aro se guarda y tu progreso queda acumulado.':'Mantén todos los aros ensartados durante dos segundos. Pueden volver a salir.';
 };
 $<HTMLInputElement>('strength').oninput=()=>{sim.strength=Number($<HTMLInputElement>('strength').value);$('strength-value').textContent=String(sim.strength);};
 $<HTMLInputElement>('drag').oninput=()=>{sim.drag=Number($<HTMLInputElement>('drag').value);$('drag-value').textContent=sim.drag.toFixed(2);};
 function pause(){paused=!paused;$('pause').textContent=paused?'▶ Continuar':'Ⅱ Pausar';$('paused-label').hidden=!paused;$('status').textContent=paused?'Simulación en pausa':'Simulación en marcha';accumulator=0;}
 $('pause').onclick=pause;
 window.addEventListener('keydown',e=>{
  if((e.target as HTMLElement).matches('input,select,textarea'))return;
  const k=e.key.toLowerCase();if([' ','arrowleft','arrowright','arrowup','arrowdown','a','d','w','s','p'].includes(k))e.preventDefault();
  keys.add(k);if(e.repeat)return;
  if(k==='p')pause();if(k===' '){if(sim.model===1)pulse('center');else{pulse('left');pulse('right');}}
  if(k==='a')pulse(sim.model===1?'center':'left');if(k==='d')pulse(sim.model===1?'center':'right');
 });
 window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());
 document.addEventListener('visibilitychange',()=>{accumulator=0;last=performance.now();keys.clear();});
 sim.onWin=()=>{clearTimeout(winTimer);$('win').textContent=sim.mode==='collect'?'Todos guardados. ¡Objetivo completo! ✓':'Todos dentro. Física comprobada ✓';$('win').hidden=false;winTimer=setTimeout(()=>$('win').hidden=true,3200);};
 const resize=()=>{const w=viewport.clientWidth,h=viewport.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;cameraFitDistance=Math.max(21.5,14.8/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))),10.7/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)))/camera.aspect);camera.updateProjectionMatrix();updateCamera();};
 new ResizeObserver(resize).observe(viewport);resize();
 $('loading').hidden=true;
 const diagnostics=()=>({date:new Date().toISOString(),engine:'Rapier 0.19.3',renderer:'Three.js 0.180.0',userAgent:navigator.userAgent,viewport:{width:innerWidth,height:innerHeight,pixelRatio:devicePixelRatio},camera:cameraSnapshot(),tankInterior:{width:2*TANK.x,height:2*TANK.y,depth:2*TANK.z},jets:JETS,pulseDuration:PULSE_DURATION,scene:activeScene,model:sim.model,gameMode:sim.mode,totalRings:sim.totalRings,collected:sim.collected,ringCount:sim.rings.length,threaded:sim.count,simulationSeconds:sim.time,fps:renderFps,averageFrameMs:frameTimes.reduce((a,b)=>a+b,0)/Math.max(1,frameTimes.length),maxPhysicsStepMs:maxPhysicsMs,averagePhysicsStepMs:stepSamples.reduce((a,b)=>a+b,0)/Math.max(1,stepSamples.length),escaped:sim.escaped,sensorMode,gravity:{...sim.gravity},strength:sim.strength,drag:sim.drag,physicsHz:1/DT,collidersPerRing:RING.segments});
 $('export').onclick=()=>{const blob=new Blob([JSON.stringify(diagnostics(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='diagnostico-aritos.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);};
 // Public diagnostic state for inspecting this POC; no control over external data.
 Object.assign(window,{aritosDiagnostics:diagnostics});
 function frame(now:number){
  requestAnimationFrame(frame);const elapsed=Math.min((now-last)/1000,.1);last=now;
  if(document.hidden)return;
  frameCount++;frameTimes.push(elapsed*1000);if(frameTimes.length>600)frameTimes.shift();
  if(now-fpsStart>=750){renderFps=Math.round(frameCount*1000/(now-fpsStart));$('fps').textContent=String(renderFps);frameCount=0;fpsStart=now;}
  if(!paused){
   let change=false;const rate=90*elapsed;
   if(keys.has('arrowleft')){manualRoll-=rate;change=true;}if(keys.has('arrowright')){manualRoll+=rate;change=true;}
   if(keys.has('arrowup')||keys.has('w')){manualPitch-=rate;change=true;}if(keys.has('arrowdown')||keys.has('s')){manualPitch+=rate;change=true;}
   if(change){manualRoll=THREE.MathUtils.clamp(manualRoll,-180,180);manualPitch=THREE.MathUtils.clamp(manualPitch,-180,180);updateManual();}
   smoothGravity.lerp(targetGravity,1-Math.exp(-elapsed*9));
   // Keep magnitude during rotation, including inversion; use target near antipodal zero.
   if(smoothGravity.length()<.05)smoothGravity.copy(targetGravity);
   sim.setGravity(smoothGravity.clone().normalize().multiplyScalar(3));
   accumulator+=elapsed;let steps=0;
   while(accumulator>=DT&&steps<12){const t=performance.now();sim.step();const ms=performance.now()-t;maxPhysicsMs=Math.max(maxPhysicsMs,ms);stepSamples.push(ms);if(stepSamples.length>600)stepSamples.shift();accumulator-=DT;steps++;}
   if(steps===12)accumulator=0;
  }
  if(ringMeshes.size!==sim.rings.length)syncMeshes();
  for(const r of sim.rings){
   const m=ringMeshes.get(r.id)!,p=r.body.translation(),q=r.body.rotation();
   m.position.set(p.x,p.y,p.z);m.quaternion.set(q.x,q.y,q.z,q.w);m.material.emissive.setHex(sim.isThreaded(r)?0x243d18:0x000000);
  }
  bubbles.forEach((b,i)=>{
   const pulse=sim.pulses[i%Math.max(1,sim.pulses.length)];b.visible=!!pulse;
   if(pulse){
    const jet=JETS[pulse.side],t=(PULSE_DURATION-pulse.left)*18+Math.floor(i/sim.pulses.length)*.18;
    b.position.set(jet.origin.x+jet.direction.x*t+Math.sin(i*2.3+t)*.12,jet.origin.y+jet.direction.y*t,(i%3-1)*.13);
    b.visible=Math.abs(b.position.x)<TANK.x-.1&&b.position.y<TANK.y-.1;
   }
  });
  debugLines.visible=$<HTMLInputElement>('debug').checked;
  if(debugLines.visible){const d=sim.world.debugRender();debugGeo.setAttribute('position',new THREE.BufferAttribute(d.vertices,3));debugGeo.setAttribute('color',new THREE.BufferAttribute(d.colors,4));debugGeo.computeBoundingSphere();}
  gravityArrow.setDirection(sim.gravity.clone().normalize());
  $('count').textContent=(sim.mode==='collect'?sim.collected:sim.count)+' / '+sim.totalRings;
  if(sim.collected>lastCollected){
   const added=sim.collected-lastCollected;lastCollected=sim.collected;
   clearTimeout(collectionFeedbackTimer);$('collected-feedback').textContent=`+${added} ${added===1?'ARO GUARDADO':'AROS GUARDADOS'}`;$('collected-feedback').hidden=false;
   collectionFeedbackTimer=setTimeout(()=>$('collected-feedback').hidden=true,1100);
  }
  $('tilt-readout').textContent=sim.gravity.y>2?'↑ BOCA ABAJO':sim.gravity.y< -2.8?'↓ GRAVEDAD NORMAL':'↗ GRAVEDAD INCLINADA';
  if(sim.escaped){$('status').textContent='Revisar: un aro salió del depósito';}
  renderer.render(scene,camera);
 }
 requestAnimationFrame(frame);
}
start().catch(e=>{console.error(e);$('loading').textContent='No se pudo iniciar WebGL o la física. Recarga en un navegador compatible.';});
