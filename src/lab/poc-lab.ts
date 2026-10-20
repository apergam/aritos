import * as THREE from 'three';
import { BASE, JETS, PEGS, PULSE_DURATION, RING, TANK, TIP, type Scene } from '../physics';
import type { SessionSnapshot } from '../game/session';
import type { Simulation } from '../physics';
import { PocRingRenderer } from '../rendering/poc-renderer';

type CameraSettings = { azimuth: number; elevation: number; distanceScale: number; targetY: number };
export type CameraSnapshot = Readonly<CameraSettings & {
  position: Readonly<{ x: number; y: number; z: number }>;
  target: Readonly<{ x: number; y: number; z: number }>;
  distance: number; fov: number; aspect: number;
}>;
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;

/** Owns the accepted POC's Three scene, fixed-step visual effects, debug view, and lab camera. */
export class PocLab {
  readonly scene = new THREE.Scene();
  readonly renderer: THREE.WebGLRenderer;
  readonly camera = new THREE.PerspectiveCamera(37, 1, .1, 100);
  private readonly ringLayer: PocRingRenderer;
  private readonly bubbles: THREE.Mesh[];
  private readonly debugGeometry = new THREE.BufferGeometry();
  private readonly debugLines: THREE.LineSegments;
  private readonly gravityArrow: THREE.ArrowHelper;
  private readonly outlets: Array<{ side: string; mesh: THREE.Mesh }>;
  private readonly cameraDefaults: CameraSettings = { azimuth: 0, elevation: .7, distanceScale: 1, targetY: 0 };
  private cameraSettings: CameraSettings = { ...this.cameraDefaults };
  private fitDistance = 25;
  private readonly resources: Array<THREE.BufferGeometry | THREE.Material> = [];
  constructor(private readonly viewport: HTMLElement, modelCount: number) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8)); this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace; this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.3;
    viewport.prepend(this.renderer.domElement); this.renderer.domElement.setAttribute('aria-label', 'Depósito 3D con aros y dos estacas');
    this.scene.add(new THREE.AmbientLight(0xffffff, 2.2));
    const key = new THREE.DirectionalLight(0xffffff, 3); key.position.set(-4, 10, 12); this.scene.add(key);
    const fill = new THREE.DirectionalLight(0x91d9c6, 1.5); fill.position.set(5, -2, -3); this.scene.add(fill);
    const v = (x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
    const mesh=(g:THREE.BufferGeometry,color:number,position:THREE.Vector3,opacity=1)=>{
      const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color,roughness:.34,metalness:.1,transparent:opacity<1,opacity,depthWrite:opacity>=1}));
      m.position.copy(position);this.scene.add(m);this.resources.push(g,m.material);return m;
    };
    mesh(new THREE.BoxGeometry(9.55,12.5,.28),0x8ab8a6,v(0,0,-TANK.z-.25));
    mesh(new THREE.PlaneGeometry(8.95,11.95),0xd4e9dc,v(0,0,-TANK.z-.08));
    const gridPositions:number[]=[];
    for(let x=-4;x<=4;x+=1)gridPositions.push(x,-5.9,-TANK.z-.05,x,5.9,-TANK.z-.05);
    for(let y=-5;y<=5;y+=1)gridPositions.push(-4.4,y,-TANK.z-.05,4.4,y,-TANK.z-.05);
    const gridGeometry=new THREE.BufferGeometry();gridGeometry.setAttribute('position',new THREE.Float32BufferAttribute(gridPositions,3));
    const grid=new THREE.LineSegments(gridGeometry,new THREE.LineBasicMaterial({color:0xa7c8b4,transparent:true,opacity:.28}));this.scene.add(grid);this.resources.push(gridGeometry,(grid.material as THREE.Material));
    for(const x of [-4.65,4.65])mesh(new THREE.BoxGeometry(.3,12.55,2*(TANK.z+.25)),0x6b9d87,v(x,0,0),.35);
    for(const y of [-6.15,6.15])mesh(new THREE.BoxGeometry(9.5,.3,2*(TANK.z+.25)),0x6b9d87,v(0,y,0),.38);
    const edges=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(9.3,12.3,2*(TANK.z+.15))),new THREE.LineBasicMaterial({color:0x447d65,transparent:true,opacity:.52}));this.scene.add(edges);this.resources.push(edges.geometry,edges.material as THREE.Material);
    for(const p of PEGS){mesh(new THREE.CylinderGeometry(.79,.86,.3,32),0x739f87,v(p.x,BASE-.15,p.z));mesh(new THREE.CylinderGeometry(.11,.11,TIP-BASE,24),0xe2c789,v(p.x,(TIP+BASE)/2,p.z));mesh(new THREE.SphereGeometry(.11,16,8),0xf4db9c,v(p.x,TIP,p.z));}
    this.outlets=Object.entries(JETS).map(([side,jet])=>{const outlet=mesh(new THREE.CylinderGeometry(.13,.18,.42,16),0x458a89,v(jet.origin.x,jet.origin.y,jet.origin.z));outlet.quaternion.setFromUnitVectors(v(0,1,0),v(jet.direction.x,jet.direction.y,jet.direction.z));return {side,mesh:outlet};});
    const front=mesh(new THREE.PlaneGeometry(9,12),0xd6fff1,v(0,0,TANK.z+.01),.035);front.renderOrder=10;
    this.ringLayer=new PocRingRenderer(this.scene);
    const jets=new THREE.Group();this.scene.add(jets);const bubbleG=new THREE.SphereGeometry(.045,7,5),bubbleM=new THREE.MeshBasicMaterial({color:0xf0fff7,transparent:true,opacity:.65});
    this.bubbles=Array.from({length:36},()=>{const b=new THREE.Mesh(bubbleG,bubbleM);jets.add(b);return b;});this.resources.push(bubbleG,bubbleM);
    this.debugLines=new THREE.LineSegments(this.debugGeometry,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.7,depthTest:false}));this.debugLines.renderOrder=20;this.scene.add(this.debugLines);this.resources.push(this.debugGeometry,this.debugLines.material as THREE.Material);
    this.gravityArrow=new THREE.ArrowHelper(v(0,-1,0),v(3.65,4.8,.9),.75,0x477b60,.2,.13);this.scene.add(this.gravityArrow);
    this.bindCameraControls();this.updateOutlets(modelCount);
    $('depth-readout').textContent=`FONDO ${(2*TANK.z).toFixed(1)} · ARO ${(2*(RING.radius+RING.tube)).toFixed(1)}`;
  }
  cameraSnapshot(): CameraSnapshot {
    return Object.freeze({...this.cameraSettings,position:Object.freeze({x:this.camera.position.x,y:this.camera.position.y,z:this.camera.position.z}),target:Object.freeze({x:0,y:this.cameraSettings.targetY,z:0}),distance:this.fitDistance*this.cameraSettings.distanceScale,fov:this.camera.fov,aspect:this.camera.aspect});
  }
  updateOutlets(modelCount:number):void {for(const {side,mesh} of this.outlets)mesh.visible=modelCount===1?side==='center':side!=='center';}
  resize():void {
    const w=this.viewport.clientWidth,h=this.viewport.clientHeight;if(!w||!h)return;
    this.renderer.setSize(w,h,false);this.camera.aspect=w/h;
    this.fitDistance=Math.max(21.5,14.8/(2*Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2))),10.7/(2*Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2)))/this.camera.aspect);
    this.camera.updateProjectionMatrix();this.updateCamera();
  }
  render(snapshot:SessionSnapshot,simulation:Simulation):void {
    this.ringLayer.update(snapshot);
    this.bubbles.forEach((b,i)=>{
      const pulse=simulation.pulses[i%Math.max(1,simulation.pulses.length)];b.visible=!!pulse;
      if(pulse){const jet=JETS[pulse.side],t=(PULSE_DURATION-pulse.left)*18+Math.floor(i/simulation.pulses.length)*.18;b.position.set(jet.origin.x+jet.direction.x*t+Math.sin(i*2.3+t)*.12,jet.origin.y+jet.direction.y*t,(i%3-1)*.13);b.visible=Math.abs(b.position.x)<TANK.x-.1&&b.position.y<TANK.y-.1;}
    });
    this.debugLines.visible=$<HTMLInputElement>('debug').checked;
    if(this.debugLines.visible){const d=simulation.world.debugRender();this.debugGeometry.setAttribute('position',new THREE.BufferAttribute(d.vertices,3));this.debugGeometry.setAttribute('color',new THREE.BufferAttribute(d.colors,4));this.debugGeometry.computeBoundingSphere();}
    this.gravityArrow.setDirection(new THREE.Vector3(simulation.gravity.x,simulation.gravity.y,simulation.gravity.z).normalize());
    this.renderer.render(this.scene,this.camera);
  }
  dispose():void {
    this.ringLayer.dispose();this.gravityArrow.cone.geometry.dispose();(this.gravityArrow.cone.material as THREE.Material).dispose();this.gravityArrow.line.geometry.dispose();(this.gravityArrow.line.material as THREE.Material).dispose();
    for(const resource of this.resources)resource.dispose();this.resources.length=0;this.renderer.dispose();this.renderer.domElement.remove();
  }
  private bindCameraControls():void {
    const update=()=>this.updateCamera();
    for(const name of ['azimuth','elevation','distanceScale','targetY'] as const){$<HTMLInputElement>('camera-'+name).oninput=()=>{this.cameraSettings[name]=Number($<HTMLInputElement>('camera-'+name).value);update();};}
    $('camera-reset').onclick=()=>{this.cameraSettings={...this.cameraDefaults};update();};
    $('camera-elevated').onclick=()=>{this.cameraSettings={...this.cameraDefaults,elevation:15};update();};
    $('camera-copy').onclick=async()=>{const config=$<HTMLTextAreaElement>('camera-config');try{await navigator.clipboard.writeText(config.value);$('camera-copy-status').textContent='Configuración copiada.';}catch{config.closest('details')!.open=true;config.focus();config.select();$('camera-copy-status').textContent='Seleccionamos los valores. Usa Copiar en tu dispositivo.';}};
  }
  private updateCamera():void {
    const azimuth=THREE.MathUtils.degToRad(this.cameraSettings.azimuth),elevation=THREE.MathUtils.degToRad(this.cameraSettings.elevation),distance=this.fitDistance*this.cameraSettings.distanceScale;
    this.camera.position.set(distance*Math.cos(elevation)*Math.sin(azimuth),this.cameraSettings.targetY+distance*Math.sin(elevation),distance*Math.cos(elevation)*Math.cos(azimuth));this.camera.lookAt(0,this.cameraSettings.targetY,0);
    for(const name of ['azimuth','elevation','distanceScale','targetY'] as const){$<HTMLInputElement>('camera-'+name).value=String(this.cameraSettings[name]);$('camera-'+name+'-value').textContent=name==='distanceScale'?this.cameraSettings[name].toFixed(2)+'×':name==='targetY'?this.cameraSettings[name].toFixed(1):this.cameraSettings[name].toFixed(1)+'°';}
    $('camera-position').textContent=`X ${this.camera.position.x.toFixed(2)} · Y ${this.camera.position.y.toFixed(2)} · Z ${this.camera.position.z.toFixed(2)}`;
    $('camera-target').textContent=`Mira: (0, ${this.cameraSettings.targetY.toFixed(1)}, 0) · Distancia: ${distance.toFixed(2)}`;
    $<HTMLTextAreaElement>('camera-config').value=JSON.stringify(this.cameraSnapshot(),null,2);$('camera-copy-status').textContent='';
  }
}
