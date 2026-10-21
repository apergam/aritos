import { PressureGestureController, type PressurePulse, type PressureSide, type PressurePointerType } from './pressure';

/** Lab-only DOM adapter: immediate fixed/levels, release-time charge/pressure. */
export function bindPressureInput(buttons: Record<PressureSide,HTMLElement>, controller:PressureGestureController, options:{paused:()=>boolean; pulse:(pulse:PressurePulse)=>void; status:(message:string)=>void}) {
 const remove:Array<()=>void>=[], captures=new Map<number,HTMLElement>(), suppress=new Set<HTMLElement>();
 const listen=(target:EventTarget,type:string,fn:EventListener)=>{target.addEventListener(type,fn);remove.push(()=>target.removeEventListener(type,fn));};
 const input=(e:PointerEvent)=>({kind:'pointer' as const,pointerType:e.pointerType as PressurePointerType,pressure:e.pressure,timeMs:e.timeStamp});
 const send=(pulse:PressurePulse|null)=>{if(pulse&&!options.paused())options.pulse(pulse);};
 const clear=()=>{controller.clear(); for(const [id,button]of captures){try{if(button.hasPointerCapture(id))button.releasePointerCapture(id);}catch{} button.classList.remove('pressed');} captures.clear(); suppress.clear();};
 for(const side of ['left','right','center'] as const){
  const button=buttons[side]; button.style.touchAction='none';
  listen(button,'pointerdown',((e:PointerEvent)=>{
   if(e.button!==0||options.paused())return; e.preventDefault(); suppress.add(button);
   if(!controller.begin(e.pointerId,side,input(e)))return;
   try{button.setPointerCapture(e.pointerId);}catch{} captures.set(e.pointerId,button);
   if(controller.mode==='fixed'||controller.mode==='levels')send(controller.release(e.pointerId,{timeMs:e.timeStamp}));
   else{button.classList.add('pressed');options.status(controller.mode==='charge'?'Cargando: suelta para bombear.':'Midiendo presión: suelta para bombear.');}
  }) as EventListener);
  listen(button,'pointermove',((e:PointerEvent)=>{if(captures.has(e.pointerId))controller.move(e.pointerId,input(e));}) as EventListener);
  listen(button,'click',((e:MouseEvent)=>{
   if(e.detail > 0 || suppress.has(button)||options.paused())return;
   // Native keyboard/assistive activation has no force sensor; use the selected level.
   send({side,intensity:controller.mode==='fixed'?1:controller.level,durationSeconds:.24,source:controller.mode==='fixed'?'fixed':'level'});
  }) as EventListener);
  listen(button,'lostpointercapture',((e:PointerEvent)=>{if(captures.has(e.pointerId)){controller.cancel(e.pointerId);captures.delete(e.pointerId);button.classList.remove('pressed');suppress.delete(button);}})as EventListener);
  listen(button,'keydown',((e:KeyboardEvent)=>{if(e.repeat&&(e.key===' '||e.key==='Enter'))e.preventDefault();})as EventListener);
 }
 const end=(e:PointerEvent,cancel:boolean)=>{
  const button=captures.get(e.pointerId);if(!button)return;
  if(cancel||options.paused())controller.cancel(e.pointerId);else send(controller.release(e.pointerId,{pressure:e.pressure,timeMs:e.timeStamp}));
  captures.delete(e.pointerId);button.classList.remove('pressed');try{if(button.hasPointerCapture(e.pointerId))button.releasePointerCapture(e.pointerId);}catch{}
  // Pointer-generated click follows pointerup; keyboard/assistive clicks after this turn remain usable.
  queueMicrotask(()=>suppress.delete(button));
 };
 listen(window,'pointerup',((e:PointerEvent)=>end(e,false))as EventListener);
 listen(window,'pointercancel',((e:PointerEvent)=>end(e,true))as EventListener);
 listen(window,'blur',clear);listen(document,'visibilitychange',()=>{if(document.hidden)clear();});
 return {clear,syncPaused(){controller.setPaused(options.paused());if(options.paused())clear();},dispose(){clear();remove.splice(0).forEach(fn=>fn());}};
}
