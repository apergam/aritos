import * as THREE from 'three';
import { initPhysics, DT, TANK, RING, JETS, PULSE_DURATION, type Scene, type GameMode } from './physics';
import { GameSession } from './game/session';
import { PocControls, PocMotionControls } from './input/poc-controls';
import { PocLab } from './lab/poc-lab';
import { renderPocStatus } from './ui/poc-view';

const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const viewport=$('viewport');

/** Application composition: connects the session, input, lab renderer, and existing Spanish controls. */
async function start(){
 await initPhysics();
 const session=new GameSession({mode:'collect'}),sim=session.simulation;
 const lab=new PocLab(viewport,sim.model);
 let activeScene:Scene='free',paused=false;
 let lastCollected=0,collectionFeedbackTimer:ReturnType<typeof setTimeout>|undefined,winTimer:ReturnType<typeof setTimeout>|undefined;
 const motion=new PocMotionControls({button:$('sensor'),status:$('sensor-status'),rollValue:$<HTMLInputElement>('roll'),pitchValue:$<HTMLInputElement>('pitch'),rollLabel:$('roll-value'),pitchLabel:$('pitch-value')});
 const targetGravity=motion.gravity,smoothGravity=targetGravity.clone();
 let accumulator=0,last=performance.now(),frameCount=0,fpsStart=last,frameTimes:number[]=[];
 let renderFps=0,maxPhysicsMs=0,stepSamples:number[]=[];
 function pulse(side:'left'|'right'|'center'){
  if(paused||document.hidden)return;
  session.dispatch({type:'pump',side});const el=$('pump-'+side);el.classList.add('pressed');setTimeout(()=>el.classList.remove('pressed'),130);
 }
 function pause(){paused=!paused;session.dispatch({type:'pause',reason:'manual',paused});$('pause').textContent=paused?'▶ Continuar':'Ⅱ Pausar';$('paused-label').hidden=!paused;$('status').textContent=paused?'Simulación en pausa':'Simulación en marcha';accumulator=0;}
 const controls=new PocControls({
  model:()=>sim.model===1?'single-button':'two-button',paused:()=>paused||document.hidden,
  pump:pulse,togglePause:pause,setManualTilt:(roll,pitch)=>motion.setManual(roll,pitch),
 },{left:$('pump-left'),right:$('pump-right'),center:$('pump-center')});
 function center(){motion.center();controls.resetTilt(0,0,false);}
 $('upright').onclick=center;$('invert').onclick=()=>{motion.invert();controls.resetTilt(180,0,false);};
 for(const name of ['roll','pitch'] as const)$<HTMLInputElement>(name).oninput=()=>{const roll=Number($<HTMLInputElement>('roll').value),pitch=Number($<HTMLInputElement>('pitch').value);motion.setManual(roll,pitch);controls.syncTilt(roll,pitch);};
 function reset(scene:Scene=activeScene){
  activeScene=scene;session.startRound({scene,model:sim.model===1?'single-button':'two-button',mode:sim.mode});center();smoothGravity.copy(targetGravity);accumulator=0;$('win').hidden=true;
  clearTimeout(winTimer);clearTimeout(collectionFeedbackTimer);lastCollected=0;$('collected-feedback').hidden=true;
  $('count-label').textContent=sim.mode==='collect'?'GUARDADOS':'ENSARTADOS';$('count').textContent='0 / '+sim.totalRings;
  const labels={free:'01 / JUEGO LIBRE',drop:'02 / CAÍDA Y CHOQUE',stack:'03 / APILAR Y EXTRAER',depth:'04 / PROFUNDIDAD'};
  $('scene-label').textContent=labels[scene];document.querySelectorAll<HTMLButtonElement>('[data-scene]').forEach(b=>b.classList.toggle('active',b.dataset.scene===scene));
 }
 document.querySelectorAll<HTMLButtonElement>('[data-scene]').forEach(b=>b.onclick=()=>reset(b.dataset.scene as Scene));
 $('reset').onclick=()=>reset();
 $<HTMLSelectElement>('model').onchange=()=>{sim.model=Number($<HTMLSelectElement>('model').value);lab.updateOutlets(sim.model);$('pump-center').hidden=sim.model!==1;$('pump-left').hidden=sim.model===1;$('pump-right').hidden=sim.model===1;reset();};
 $<HTMLSelectElement>('game-mode').onchange=()=>{sim.mode=$<HTMLSelectElement>('game-mode').value as GameMode;reset();$('mode-hint').textContent=sim.mode==='collect'?'Al llegar a la base, el aro se guarda y tu progreso queda acumulado.':'Mantén todos los aros ensartados durante dos segundos. Pueden volver a salir.';};
 $<HTMLInputElement>('strength').oninput=()=>{sim.strength=Number($<HTMLInputElement>('strength').value);$('strength-value').textContent=String(sim.strength);};
 $<HTMLInputElement>('drag').oninput=()=>{sim.drag=Number($<HTMLInputElement>('drag').value);$('drag-value').textContent=sim.drag.toFixed(2);};
 $('pause').onclick=pause;
 document.addEventListener('visibilitychange',()=>{accumulator=0;last=performance.now();session.dispatch({type:'pause',reason:'document-hidden',paused:document.hidden});});
 session.subscribe(event=>{
  if(event.type==='victory'&&event.roundId===session.snapshot().roundId){clearTimeout(winTimer);$('win').textContent=event.mode==='collect'?'Todos guardados. ¡Objetivo completo! ✓':'Todos dentro. Física comprobada ✓';$('win').hidden=false;winTimer=setTimeout(()=>$('win').hidden=true,3200);}
 });
 const resize=()=>lab.resize();const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(viewport);resize();
 $('loading').hidden=true;
 const diagnostics=()=>({date:new Date().toISOString(),engine:'Rapier 0.19.3',renderer:'Three.js 0.180.0',userAgent:navigator.userAgent,viewport:{width:innerWidth,height:innerHeight,pixelRatio:devicePixelRatio},camera:lab.cameraSnapshot(),tankInterior:{width:2*TANK.x,height:2*TANK.y,depth:2*TANK.z},jets:JETS,pulseDuration:PULSE_DURATION,scene:activeScene,model:sim.model,gameMode:sim.mode,totalRings:sim.totalRings,collected:sim.collected,ringCount:sim.rings.length,threaded:sim.count,simulationSeconds:sim.time,fps:renderFps,averageFrameMs:frameTimes.reduce((a,b)=>a+b,0)/Math.max(1,frameTimes.length),maxPhysicsStepMs:maxPhysicsMs,averagePhysicsStepMs:stepSamples.reduce((a,b)=>a+b,0)/Math.max(1,stepSamples.length),escaped:sim.escaped,sensorMode:motion.sensorMode,gravity:{...sim.gravity},strength:sim.strength,drag:sim.drag,physicsHz:1/DT,collidersPerRing:RING.segments});
 $('export').onclick=()=>{const blob=new Blob([JSON.stringify(diagnostics(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='diagnostico-aritos.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);};
 Object.assign(window,{aritosDiagnostics:diagnostics});
 let animationFrame=0,disposed=false;
 function frame(now:number){
  if(disposed)return;animationFrame=requestAnimationFrame(frame);const elapsed=Math.min((now-last)/1000,.1);last=now;if(document.hidden)return;
  frameCount++;frameTimes.push(elapsed*1000);if(frameTimes.length>600)frameTimes.shift();
  if(now-fpsStart>=750){renderFps=Math.round(frameCount*1000/(now-fpsStart));$('fps').textContent=String(renderFps);frameCount=0;fpsStart=now;}
  if(!paused){
   controls.update(elapsed);smoothGravity.lerp(targetGravity,1-Math.exp(-elapsed*9));if(smoothGravity.length()<.05)smoothGravity.copy(targetGravity);
   session.dispatch({type:'orient',gravity:smoothGravity.clone().normalize().multiplyScalar(3)});
   accumulator+=elapsed;let steps=0;
   while(accumulator>=DT&&steps<12){const t=performance.now();session.step();const ms=performance.now()-t;maxPhysicsMs=Math.max(maxPhysicsMs,ms);stepSamples.push(ms);if(stepSamples.length>600)stepSamples.shift();accumulator-=DT;steps++;}
   if(steps===12)accumulator=0;
  }
  const snapshot=session.snapshot();renderPocStatus(document,snapshot);lab.render(snapshot,sim);
  $('count').textContent=(sim.mode==='collect'?sim.collected:sim.count)+' / '+sim.totalRings;
  if(sim.collected>lastCollected){const added=sim.collected-lastCollected;lastCollected=sim.collected;clearTimeout(collectionFeedbackTimer);$('collected-feedback').textContent=`+${added} ${added===1?'ARO GUARDADO':'AROS GUARDADOS'}`;$('collected-feedback').hidden=false;collectionFeedbackTimer=setTimeout(()=>$('collected-feedback').hidden=true,1100);}
  $('tilt-readout').textContent=sim.gravity.y>2?'↑ BOCA ABAJO':sim.gravity.y< -2.8?'↓ GRAVEDAD NORMAL':'↗ GRAVEDAD INCLINADA';if(sim.escaped)$('status').textContent='Revisar: un aro salió del depósito';
 }
 const schedule=()=>{if(!disposed)animationFrame=requestAnimationFrame(frame);};
 schedule();
 const onPageHide=(event:PageTransitionEvent)=>{cancelAnimationFrame(animationFrame);resizeObserver.disconnect();if(event.persisted)return;disposed=true;controls.dispose();motion.dispose();lab.dispose();session.dispose();clearTimeout(winTimer);clearTimeout(collectionFeedbackTimer);};
 const onPageShow=(event:PageTransitionEvent)=>{if(event.persisted&&!disposed){last=performance.now();resizeObserver.observe(viewport);schedule();}};
 window.addEventListener('pagehide',onPageHide);window.addEventListener('pageshow',onPageShow);
}
start().catch(e=>{console.error(e);$('loading').textContent='No se pudo iniciar WebGL o la física. Recarga en un navegador compatible.';});
