import * as THREE from 'three';
import { PULSE_DURATION, RING } from '../physics';
import { createLabLayout, type LabLayout } from './experiments/geometry';
import { REAR_INSERT_ASSETS, theme, type ThemeId } from '../themes';
import type { SessionSnapshot } from '../game/session';
import type { Simulation } from '../physics';
import { PocRingRenderer } from '../rendering/poc-renderer';
import { toyModel, TOY_PHYSICS, type ToyModelId } from '../models/toy-model';

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
  private readonly outlets: Array<{ side: string; mesh: THREE.Mesh }> = [];
  private readonly toyGroup = new THREE.Group();
  private readonly toyResources: Array<THREE.BufferGeometry | THREE.Material> = [];
  private readonly textures = new Map<ThemeId, THREE.Texture>();
  private currentLayout: LabLayout = createLabLayout();
  private currentTheme: ThemeId = 'ocean';
  private currentModel: ToyModelId = 'two-button';
  private disposed = false;
  private rearMaterial?: THREE.MeshBasicMaterial;
  private readonly cameraDefaults: CameraSettings = { azimuth: 0, elevation: .7, distanceScale: 1, targetY: 0 };
  private cameraSettings: CameraSettings = { ...this.cameraDefaults };
  private fitDistance = 25;
  private readonly resources: Array<THREE.BufferGeometry | THREE.Material> = [];
  constructor(private readonly viewport: HTMLElement, model: ToyModelId) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8)); this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace; this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.3;
    viewport.prepend(this.renderer.domElement); this.renderer.domElement.setAttribute('aria-label', 'Depósito 3D con aros y dos estacas');
    this.scene.add(new THREE.AmbientLight(0xffffff, 2.2));
    const key = new THREE.DirectionalLight(0xffffff, 3); key.position.set(-4, 10, 12); this.scene.add(key);
    const fill = new THREE.DirectionalLight(0x91d9c6, 1.5); fill.position.set(5, -2, -3); this.scene.add(fill);
    const v = (x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
    this.scene.add(this.toyGroup);
    this.rebuildToy();
    for (const id of ['ocean','space','capybaras'] as const) {
      new THREE.TextureLoader().load(REAR_INSERT_ASSETS[id].source, texture => {
        if (this.disposed) { texture.dispose(); return; }
        texture.colorSpace = THREE.SRGBColorSpace; this.textures.set(id, texture);
        if (this.currentTheme === id && this.rearMaterial) { this.rearMaterial.map = texture; this.rearMaterial.needsUpdate = true; }
      });
    }
    this.ringLayer=new PocRingRenderer(this.scene);
    const jets=new THREE.Group();this.scene.add(jets);const bubbleG=new THREE.SphereGeometry(.045,7,5),bubbleM=new THREE.MeshBasicMaterial({color:0xf0fff7,transparent:true,opacity:.65});
    this.bubbles=Array.from({length:36},()=>{const b=new THREE.Mesh(bubbleG,bubbleM);jets.add(b);return b;});this.resources.push(bubbleG,bubbleM);
    this.debugLines=new THREE.LineSegments(this.debugGeometry,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.7,depthTest:false}));this.debugLines.renderOrder=20;this.scene.add(this.debugLines);this.resources.push(this.debugGeometry,this.debugLines.material as THREE.Material);
    this.gravityArrow=new THREE.ArrowHelper(v(0,-1,0),v(3.65,4.8,.9),.75,0x477b60,.2,.13);this.scene.add(this.gravityArrow);
    this.bindCameraControls();this.updateOutlets(model);
    $('depth-readout').textContent=`FONDO ${(2*this.currentLayout.tank.z).toFixed(1)} · ARO ${(2*(RING.radius+RING.tube)).toFixed(1)}`;
  }
  setLayout(layout: LabLayout): void { if (this.currentLayout !== layout) { this.currentLayout = layout; this.rebuildToy(); this.resize(); } }
  setTheme(id: ThemeId): void { this.currentTheme = id; this.rebuildToy(); this.ringLayer.setTheme(id); }
  projectPoint(point: {x:number;y:number;z:number}): {x:number;y:number} {
    const p = new THREE.Vector3(point.x,point.y,point.z).project(this.camera);
    return { x: (p.x+1)*this.viewport.clientWidth/2, y: (1-p.y)*this.viewport.clientHeight/2 };
  }
  private rebuildToy(): void {
    this.toyGroup.clear(); for (const resource of this.toyResources) resource.dispose(); this.toyResources.length = 0; this.outlets.length = 0;
    const {tank,pegs,jets} = this.currentLayout, colors = theme(this.currentTheme).colors;
    this.scene.background = new THREE.Color(colors.background);
    const mesh = (g:THREE.BufferGeometry,color:number,x:number,y:number,z:number,opacity=1) => {
      const m = new THREE.MeshStandardMaterial({color,roughness:.34,metalness:.08,transparent:opacity<1,opacity,depthWrite:opacity>=1});
      const object = new THREE.Mesh(g,m); object.position.set(x,y,z); this.toyGroup.add(object); this.toyResources.push(g,m); return object;
    };
    mesh(new THREE.BoxGeometry(tank.x*2+.55,12.5,.28),colors.housing,0,0,-tank.z-.25,.7);
    const rearMaterial = new THREE.MeshBasicMaterial({color:0xffffff,map:this.textures.get(this.currentTheme),transparent:true,opacity:.78,depthWrite:false,toneMapped:false});
    const rearGeometry = new THREE.PlaneGeometry(tank.x*2-.3,11.6);
    const rear = new THREE.Mesh(rearGeometry,rearMaterial); rear.position.set(0,0,-tank.z+.095); this.toyGroup.add(rear); this.toyResources.push(rearGeometry,rearMaterial); this.rearMaterial=rearMaterial;
    for(const x of [-tank.x-.15,tank.x+.15]) mesh(new THREE.BoxGeometry(.3,12.55,2*(tank.z+.25)),colors.housingEdge,x,0,0,.4);
    for(const y of [-6.15,6.15]) mesh(new THREE.BoxGeometry(tank.x*2+.5,.3,2*(tank.z+.25)),colors.housingEdge,0,y,0,.42);
    for(const p of pegs){
      mesh(new THREE.CylinderGeometry(.79,.86,.3,32),colors.base,p.x,p.baseY-.15,p.z);
      mesh(new THREE.CylinderGeometry(TOY_PHYSICS.pegRadius,TOY_PHYSICS.pegRadius,p.tipY-p.baseY,24),colors.peg,p.x,(p.tipY+p.baseY)/2,p.z);
      mesh(new THREE.SphereGeometry(TOY_PHYSICS.pegRadius,16,8),colors.peg,p.x,p.tipY,p.z);
    }
    // Raised variants expose the same support boxes used by Rapier.
    const supports = (this.currentLayout as LabLayout & {supports?:readonly {center:{x:number;y:number;z:number};halfExtents:{x:number;y:number;z:number}}[]}).supports ?? [];
    for(const support of supports){const c=support.center,h=support.halfExtents;mesh(new THREE.BoxGeometry(h.x*2,h.y*2,h.z*2),colors.base,c.x,c.y,c.z);}
    for(const [side,jet] of Object.entries(jets)){
      const outlet=mesh(new THREE.CylinderGeometry(.13,.18,.42,16),colors.button,jet.origin.x,jet.origin.y,jet.origin.z);
      outlet.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(jet.direction.x,jet.direction.y,jet.direction.z)); this.outlets.push({side,mesh:outlet});
    }
    const front=mesh(new THREE.PlaneGeometry(tank.x*2,12),colors.water,0,0,tank.z+.01,.035);front.renderOrder=10;
    this.updateOutlets(this.currentModel);
  }
  cameraSnapshot(): CameraSnapshot {
    return Object.freeze({...this.cameraSettings,position:Object.freeze({x:this.camera.position.x,y:this.camera.position.y,z:this.camera.position.z}),target:Object.freeze({x:0,y:this.cameraSettings.targetY,z:0}),distance:this.fitDistance*this.cameraSettings.distanceScale,fov:this.camera.fov,aspect:this.camera.aspect});
  }
  updateOutlets(model:ToyModelId):void {this.currentModel=model;const sides:readonly string[]=toyModel(model).outlets;for(const {side,mesh} of this.outlets)mesh.visible=sides.includes(side);}
  resize():void {
    const w=this.viewport.clientWidth,h=this.viewport.clientHeight;if(!w||!h)return;
    this.renderer.setSize(w,h,false);this.camera.aspect=w/h;
    this.fitDistance=Math.max(21.5,14.8/(2*Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2))),(this.currentLayout.tank.x*2+1.7)/(2*Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2)))/this.camera.aspect);
    this.camera.updateProjectionMatrix();this.updateCamera();
  }
  render(snapshot:SessionSnapshot,simulation:Simulation,enemyIds:ReadonlySet<number>=new Set()):void {
    this.setLayout(simulation.layout);
    const TANK=simulation.layout.tank,JETS=simulation.layout.jets;
    this.ringLayer.update(snapshot,enemyIds);
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
    this.disposed=true; for(const texture of this.textures.values())texture.dispose(); this.textures.clear(); for(const resource of this.toyResources)resource.dispose(); this.toyResources.length=0;
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
