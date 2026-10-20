import * as THREE from 'three';
import type { SessionSnapshot } from '../game/session';
import { TOY_PHYSICS, toyModel, type PumpSide, type ToyModelId } from '../models/toy-model';
import { REAR_INSERT_ASSETS, theme, type ThemeId } from '../themes';
import { applyRingAppearance } from '../themes/ring-appearance';

export type RenderQuality = 'high' | 'reduced';
export type PlayerRendererOptions = Readonly<{ model: ToyModelId; theme: ThemeId; quality?: RenderQuality }>;
export type ToySurfaceBounds = Readonly<{ left: number; top: number; width: number; height: number }>;

/** Project the accepted front tank face into CSS pixels relative to its viewport. */
export function projectToySurfaceBounds(camera: THREE.Camera, width: number, height: number): ToySurfaceBounds {
  if (width <= 0 || height <= 0) return Object.freeze({ left: 0, top: 0, width: 0, height: 0 });
  const tank = TOY_PHYSICS.tank;
  const halfWidth = tank.x + 0.08;
  const halfHeight = tank.y + 0.16;
  const frontZ = tank.z + 0.0875;
  camera.updateMatrixWorld();
  const corners = [
    new THREE.Vector3(-halfWidth, -halfHeight, frontZ), new THREE.Vector3(-halfWidth, halfHeight, frontZ),
    new THREE.Vector3(halfWidth, -halfHeight, frontZ), new THREE.Vector3(halfWidth, halfHeight, frontZ),
  ].map(point => point.project(camera));
  const xs = corners.map(point => (point.x + 1) * width / 2);
  const ys = corners.map(point => (1 - point.y) * height / 2);
  const left = Math.max(0, Math.min(...xs)), right = Math.min(width, Math.max(...xs));
  const top = Math.max(0, Math.min(...ys)), bottom = Math.min(height, Math.max(...ys));
  return Object.freeze({ left, top, width: right - left, height: bottom - top });
}

/** Fixed front view uses the accepted 0.7 degree elevation. */
export function fixedCameraPosition(distance: number): Readonly<{ x: number; y: number; z: number }> {
  const elevation = THREE.MathUtils.degToRad(0.7);
  return Object.freeze({ x: 0, y: distance * Math.sin(elevation), z: distance * Math.cos(elevation) });
}

type LivePulse = { side: PumpSide; started: number; seed: number };

/**
 * Production toy renderer. It consumes immutable poses and owns only visual state;
 * changing a model/theme never reaches the simulation or changes a round.
 */
export class PlayerRenderer {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(37, 1, 0.1, 100);
  readonly renderer: THREE.WebGLRenderer;

  private readonly ringGeometry = new THREE.TorusGeometry(TOY_PHYSICS.ring.radius, TOY_PHYSICS.ring.tube, 16, 48);
  private readonly rings = new Map<number, THREE.Mesh<THREE.TorusGeometry, THREE.MeshPhysicalMaterial>>();
  private readonly geometries = new Set<THREE.BufferGeometry>([this.ringGeometry]);
  private readonly materials = new Set<THREE.Material>();
  private readonly bubbles: THREE.Mesh[] = [];
  private readonly pulses: LivePulse[] = [];
  private readonly modelGroup = new THREE.Group();
  private readonly tankGroup = new THREE.Group();
  private readonly tankMaterials: Record<string, THREE.MeshPhysicalMaterial> = {};
  private readonly themeColors: Array<{ material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial; key: keyof ReturnType<typeof theme>['colors'] }> = [];
  private readonly outlets: Array<{ side: PumpSide; mesh: THREE.Mesh }> = [];
  private readonly themeDecor = new Map<ThemeId, THREE.Group>();
  private readonly rearInserts = new Map<ThemeId, THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>>();
  private readonly rearInsertTextures = new Map<ThemeId, THREE.Texture>();
  private readonly pendingRearInsertLoads = new Set<ThemeId>();
  private currentTheme: ThemeId;
  private currentModel: ToyModelId;
  private quality: RenderQuality;
  private disposed = false;

  constructor(private readonly container: HTMLElement, options: PlayerRendererOptions) {
    this.currentTheme = options.theme;
    this.currentModel = options.model;
    this.quality = options.quality ?? 'high';
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.quality === 'high', alpha: true,
      powerPreference: this.quality === 'high' ? 'high-performance' : 'low-power',
    });
    this.renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, this.quality === 'high' ? 1.8 : 1));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.22;
    this.renderer.domElement.setAttribute('aria-label', 'Juguete de agua 3D con aros y estacas');
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.container.append(this.renderer.domElement);

    this.scene.add(new THREE.HemisphereLight(0xe9faff, 0x45546e, 2.1));
    const key = new THREE.DirectionalLight(0xfff4df, 3.1);
    key.position.set(-5, 10, 13);
    this.scene.add(key);
    const cool = new THREE.DirectionalLight(0x9ce8f5, 1.65);
    cool.position.set(7, 0, -6);
    this.scene.add(cool);
    const rimLight = new THREE.PointLight(0xffe8c4, 40, 26, 2);
    rimLight.position.set(0, 7, 4);
    this.scene.add(rimLight);
    this.scene.add(this.tankGroup, this.modelGroup);
    this.createTank();
    this.createRearInserts();
    this.createBubbles();
    this.setTheme(this.currentTheme);
    this.setModel(this.currentModel);
    this.resize();
  }

  /** Project readonly round poses into stable-ID meshes. */
  render(snapshot: SessionSnapshot): void {
    const now = typeof performance === 'undefined' ? Date.now() : performance.now();
    const alive = new Set(snapshot.rings.map(ring => ring.id));
    for (const [id, mesh] of this.rings) {
      if (!alive.has(id)) {
        this.scene.remove(mesh);
        mesh.material.dispose();
        this.materials.delete(mesh.material);
        this.rings.delete(id);
      }
    }
    for (const pose of snapshot.rings) {
      let mesh = this.rings.get(pose.id);
      if (!mesh) {
        const material = new THREE.MeshPhysicalMaterial();
        applyRingAppearance(material, this.currentTheme, pose.id, pose.threaded);
        mesh = new THREE.Mesh(this.ringGeometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.rings.set(pose.id, mesh);
        this.materials.add(material);
        this.scene.add(mesh);
      }
      applyRingAppearance(mesh.material, this.currentTheme, pose.id, pose.threaded);
      mesh.userData.threaded = pose.threaded;
      mesh.position.set(pose.position.x, pose.position.y, pose.position.z);
      mesh.quaternion.set(pose.rotation.x, pose.rotation.y, pose.rotation.z, pose.rotation.w);
    }
    this.animateBubbles(now);
    this.renderer.render(this.scene, this.camera);
  }

  /** Theme mutation is appearance-only; existing ring meshes and poses are retained. */
  setTheme(id: ThemeId): void {
    this.currentTheme = id;
    const colors = theme(id).colors;
    this.scene.background = new THREE.Color(colors.background);
    const housing = this.tankMaterials.housing;
    const edge = this.tankMaterials.edge;
    const water = this.tankMaterials.water;
    const deep = this.tankMaterials.deepWater;
    if (housing) housing.color.setHex(colors.housing);
    if (edge) edge.color.setHex(colors.housingEdge);
    if (water) water.color.setHex(colors.water);
    if (deep) deep.color.setHex(colors.waterDeep);
    for (const { side: _side, mesh } of this.outlets) {
      (mesh.material as THREE.MeshStandardMaterial).color.setHex(colors.buttonEdge);
    }
    for (const entry of this.themeColors) entry.material.color.setHex(colors[entry.key] as number);
    for (const bubble of this.bubbles) (bubble.material as THREE.MeshBasicMaterial).color.setHex(colors.bubble);
    for (const [themeId, group] of this.themeDecor) {
      group.visible = themeId === id;
    }
    for (const [themeId, insert] of this.rearInserts) insert.visible = themeId === id;
    for (const [id, ring] of this.rings) applyRingAppearance(ring.material, this.currentTheme, id, Boolean(ring.userData.threaded));
  }

  /** Model changes only select the matching visual jet outlets. */
  setModel(id: ToyModelId): void {
    if (this.currentModel !== id || this.modelGroup.children.length === 0) {
      this.clearGroup(this.modelGroup);
      this.outlets.splice(0);
      this.currentModel = id;
      this.createOutlets();
    }
    const visible = new Set(toyModel(id).outlets);
    for (const outlet of this.outlets) outlet.mesh.visible = visible.has(outlet.side);
  }

  /** Trigger brief visual bubbles in response to a semantic pump event. */
  pulse(side: PumpSide): void {
    this.pulses.push({ side, started: (typeof performance === 'undefined' ? Date.now() : performance.now()), seed: Math.random() * 100 });
    if (this.pulses.length > 8) this.pulses.splice(0, this.pulses.length - 8);
  }

  resize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (!width || !height) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    const fov = THREE.MathUtils.degToRad(this.camera.fov);
    const vertical = 14.8 / (2 * Math.tan(fov / 2));
    const horizontal = 10.7 / (2 * Math.tan(fov / 2) * this.camera.aspect);
    const distance = Math.max(21.5, vertical, horizontal);
    const position = fixedCameraPosition(distance);
    this.camera.position.set(position.x, position.y, position.z);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();
  }

  /** Front tank face in viewport-container CSS pixels for toy-bound overlays. */
  toySurfaceBounds(): ToySurfaceBounds {
    return projectToySurfaceBounds(this.camera, this.container.clientWidth, this.container.clientHeight);
  }

  dispose(): void {
    this.disposed = true;
    this.rings.clear();
    this.pulses.length = 0;
    for (const texture of this.rearInsertTextures.values()) texture.dispose();
    this.rearInsertTextures.clear();
    this.pendingRearInsertLoads.clear();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    for (const geometry of this.geometries) geometry.dispose();
    for (const material of this.materials) material.dispose();
    this.geometries.clear();
    this.materials.clear();
  }

  private createTank(): void {
    const colors = theme(this.currentTheme).colors;
    this.tankMaterials.housing = this.physical(colors.housing, 0.18, 0.12);
    this.tankMaterials.edge = this.physical(colors.housingEdge, 0.34, 0.08);
    this.tankMaterials.water = this.physical(colors.water, 0.29, 0.03);
    this.tankMaterials.deepWater = this.physical(colors.waterDeep, 0.54, 0.02);
    this.bindThemeColor(this.tankMaterials.housing, 'housing');
    this.bindThemeColor(this.tankMaterials.edge, 'housingEdge');
    this.bindThemeColor(this.tankMaterials.water, 'water');
    this.bindThemeColor(this.tankMaterials.deepWater, 'waterDeep');
    const shell = this.tankMaterials.housing;
    const edge = this.tankMaterials.edge;
    const water = this.tankMaterials.water;
    const deep = this.tankMaterials.deepWater;
    const tank = TOY_PHYSICS.tank;
    const x = tank.x;
    const y = tank.y;
    const z = tank.z;
    // Rear tint and floor establish a filled, shallow water chamber while keeping its depth legible.
    this.box(this.tankGroup, 2 * (x - 0.15), 2 * (y - 0.15), 0.055, deep, [0, 0, -z - 0.03]);
    this.box(this.tankGroup, 2 * (x - 0.15), 0.12, 2 * (z - 0.04), water, [0, -y + 0.015, 0]);
    // Four transparent acrylic walls; the front catches highlights without hiding rings.
    this.box(this.tankGroup, 0.16, 2 * y + 0.32, 2 * z + 0.2, shell, [-x - 0.04, 0, 0]);
    this.box(this.tankGroup, 0.16, 2 * y + 0.32, 2 * z + 0.2, shell, [x + 0.04, 0, 0]);
    const rear = this.box(this.tankGroup, 2 * x + 0.16, 2 * y + 0.32, 0.13, shell, [0, 0, -z - 0.035]);
    rear.renderOrder = 1;
    const front = this.box(this.tankGroup, 2 * x + 0.16, 2 * y + 0.32, 0.085, shell, [0, 0, z + 0.045]);
    front.renderOrder = 8;
    // Molded outer rim and corner rails give the thin transparent walls a toy-like structure.
    this.box(this.tankGroup, 2 * x + 0.56, 0.36, 2 * z + 0.45, edge, [0, y + 0.13, 0]);
    this.box(this.tankGroup, 2 * x + 0.5, 0.33, 2 * z + 0.42, edge, [0, -y - 0.12, 0]);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const rail = this.box(this.tankGroup, 0.23, 2 * y + 0.45, 0.23, edge, [sx * (x + 0.12), 0, sz * (z + 0.11)]);
      rail.castShadow = true;
    }
    // A faint waterline and side reflections reinforce depth without obscuring gameplay.
    const lineMaterial = this.standard(theme(this.currentTheme).colors.bubble, 0.3, 0.02, true, 0.25);
    this.bindThemeColor(lineMaterial, 'bubble');
    this.box(this.tankGroup, 2 * (x - 0.23), 0.025, 0.035, lineMaterial, [0, y - 0.54, 0]);
    this.box(this.tankGroup, 0.025, 2 * (y - 0.55), 0.035, lineMaterial, [-x + 0.13, -0.24, 0]);
    this.box(this.tankGroup, 0.025, 2 * (y - 0.55), 0.035, lineMaterial, [x - 0.13, -0.24, 0]);
    for (let i = 0; i < 4; i++) {
      const p = TOY_PHYSICS.pegs[i % TOY_PHYSICS.pegs.length];
      const side = i < 2 ? -1 : 1;
      const yLine = -4.7 + (i % 2) * 0.68;
      const reflection = this.box(this.tankGroup, 0.025, 0.28, 0.025, lineMaterial, [side * 4.15, yLine, p.z]);
      reflection.rotation.z = side * 0.34;
    }
    this.createBasesAndPegs();
    this.createDecorations();
  }

  private createBasesAndPegs(): void {
    const colors = theme(this.currentTheme).colors;
    for (const peg of TOY_PHYSICS.pegs) {
      const baseMat = this.standard(colors.base, 0.31, 0.12);
      this.bindThemeColor(baseMat, 'base');
      const footY = TOY_PHYSICS.base.topY - TOY_PHYSICS.base.footHeight / 2;
      this.cylinder(this.tankGroup, 0.79, 0.85, TOY_PHYSICS.base.footHeight, 32, baseMat, [peg.x, footY, peg.z]);
      const baseTop = this.standard(colors.housingEdge, 0.3, 0.18);
      this.bindThemeColor(baseTop, 'housingEdge');
      const capHeight = 0.04;
      this.cylinder(this.tankGroup, 0.54, 0.7, capHeight, 32, baseTop, [peg.x, TOY_PHYSICS.base.topY - capHeight / 2, peg.z]);
      const pegMat = this.standard(colors.peg, 0.2, 0.42);
      this.bindThemeColor(pegMat, 'peg');
      const length = TOY_PHYSICS.pegTipY - TOY_PHYSICS.base.topY;
      this.cylinder(this.tankGroup, TOY_PHYSICS.pegRadius, TOY_PHYSICS.pegRadius, length, 24, pegMat, [peg.x, (TOY_PHYSICS.pegTipY + TOY_PHYSICS.base.topY) / 2, peg.z]);
      const tipMat = this.standard(colors.peg, 0.19, 0.35);
      this.bindThemeColor(tipMat, 'peg');
      this.sphere(this.tankGroup, TOY_PHYSICS.pegRadius, 20, 12, tipMat, [peg.x, TOY_PHYSICS.pegTipY, peg.z]);
    }
  }

  private createOutlets(): void {
    const color = theme(this.currentTheme).colors.buttonEdge;
    const config = toyModel(this.currentModel);
    for (const side of config.outlets) {
      const outlet = config.outletDefinitions[side];
      if (!outlet) continue;
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.37, 20), this.standard(color, 0.27, 0.14));
      mesh.position.set(outlet.origin.x, outlet.origin.y, outlet.origin.z);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(outlet.direction.x, outlet.direction.y, outlet.direction.z));
      mesh.castShadow = true;
      this.modelGroup.add(mesh);
      this.outlets.push({ side, mesh });
    }
  }

  private createBubbles(): void {
    const bubbleGeometry = new THREE.SphereGeometry(0.052, this.quality === 'high' ? 10 : 6, this.quality === 'high' ? 8 : 5);
    const material = new THREE.MeshBasicMaterial({ color: theme(this.currentTheme).colors.bubble, transparent: true, opacity: 0.75, depthWrite: false });
    this.geometries.add(bubbleGeometry);
    this.materials.add(material);
    for (let i = 0; i < (this.quality === 'high' ? 32 : 12); i++) {
      const bubble = new THREE.Mesh(bubbleGeometry, material);
      bubble.visible = false;
      this.scene.add(bubble);
      this.bubbles.push(bubble);
    }
  }

  private animateBubbles(now: number): void {
    const duration = 1050;
    for (let i = this.pulses.length - 1; i >= 0; i--) if (now - this.pulses[i].started > duration) this.pulses.splice(i, 1);
    const activeCount = this.pulses.length;
    this.bubbles.forEach((bubble, index) => {
      if (index >= activeCount * (this.quality === 'high' ? 10 : 4) || !activeCount) { bubble.visible = false; return; }
      const pulseIndex = Math.floor(index / (this.quality === 'high' ? 10 : 4));
      const pulse = this.pulses[pulseIndex];
      const local = (now - pulse.started) / duration;
      const toy = toyModel(this.currentModel);
      const outlet = toy.outletDefinitions[pulse.side] ?? toy.outletDefinitions.center;
      if (!outlet) { bubble.visible = false; return; }
      const n = index % (this.quality === 'high' ? 10 : 4);
      const travel = local * 3.25 + n * 0.14;
      const sideWave = Math.sin(pulse.seed + n * 2.1 + local * 7) * 0.19;
      bubble.position.set(outlet.origin.x + outlet.direction.x * travel + sideWave, outlet.origin.y + outlet.direction.y * travel, (n % 3 - 1) * 0.12);
      const scale = (0.45 + Math.sin(local * Math.PI) * 0.75) * (1 - n * 0.025);
      bubble.scale.setScalar(scale);
      bubble.visible = bubble.position.y < TOY_PHYSICS.tank.y - 0.3 && Math.abs(bubble.position.x) < TOY_PHYSICS.tank.x - 0.15;
    });
  }

  private createDecorations(): void {
    const ocean = this.makeDecorationGroup('ocean');
    this.addPoints(ocean, this.seededPoints(79, 48, 24, 22), 0xefffff, 0.16, 0.65);
    for (let wave = 0; wave < 3; wave++) {
      const vertices: THREE.Vector3[] = [];
      for (let i = 0; i <= 40; i++) {
        const x = -8 + i * 0.4;
        vertices.push(new THREE.Vector3(x, 6.8 + wave * 0.28 + Math.sin(i * 0.25 + wave) * 0.09, -2.4));
      }
      this.addLine(ocean, vertices, 0xb8fff5, 0.38);
    }
    this.addSeaweed(ocean, -5.7, -5.8, 0x5cba9a);
    this.addSeaweed(ocean, 5.75, -5.9, 0x5cba9a);

    const space = this.makeDecorationGroup('space');
    this.addPoints(space, this.seededPoints(443, 90, 25, 23), 0xf5efff, 0.13, 0.46);
    const planet = new THREE.Mesh(new THREE.SphereGeometry(0.82, 32, 20), this.standard(0x866fe0, 0.48, 0.16));
    planet.position.set(6.15, 4.5, -2.35);
    this.trackMesh(planet);
    space.add(planet);
    const planetRing = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.055, 8, 64), this.standard(0xf5c56f, 0.34, 0.35));
    planetRing.position.copy(planet.position);
    planetRing.rotation.set(0.56, 0.14, 0.26);
    this.trackMesh(planetRing);
    space.add(planetRing);
    for (const [x, y] of [[-6.3, 4.4], [6.7, -2.3], [-6.7, -2.1]] as const) this.addStar(space, x, y);

    const capybaras = this.makeDecorationGroup('capybaras');
    this.addPoints(capybaras, this.seededPoints(190, 55, 24, 21), 0xfff5da, 0.17, 0.52);
    this.addReeds(capybaras, -5.75, -5.9);
    this.addReeds(capybaras, 5.75, -5.9);
    this.addLilyPad(capybaras, -5.85, -6.05);
    this.addLilyPad(capybaras, 5.85, -6.05);
  }

  /**
   * Bundled illustrations sit on the inner face of the rear acrylic wall. They
   * remain behind the water and every physical ring, with open center space
   * preserving contrast around holes and peg tips.
   */
  private createRearInserts(): void {
    const tank = TOY_PHYSICS.tank;
    const z = -tank.z + 0.095;
    const panelWidth = 2 * (tank.x - 0.15);
    const panelHeight = 2 * (tank.y - 0.2);
    for (const id of ['ocean', 'capybaras', 'space'] as const) {
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: this.quality === 'high' ? 0.78 : 0.62,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(panelWidth, panelHeight), material);
      mesh.position.set(0, 0, z);
      mesh.renderOrder = 2;
      mesh.visible = id === this.currentTheme;
      this.tankGroup.add(mesh);
      this.geometries.add(mesh.geometry);
      this.materials.add(material);
      this.rearInserts.set(id, mesh);
      this.loadRearInsert(id, material);
    }
  }

  private loadRearInsert(id: ThemeId, material: THREE.MeshBasicMaterial): void {
    if (this.pendingRearInsertLoads.has(id) || this.rearInsertTextures.has(id)) return;
    this.pendingRearInsertLoads.add(id);
    new THREE.TextureLoader().load(REAR_INSERT_ASSETS[id].source, texture => {
      this.pendingRearInsertLoads.delete(id);
      if (this.disposed || !this.rearInserts.has(id)) {
        texture.dispose();
        return;
      }
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = this.quality === 'high' ? Math.min(4, this.renderer.capabilities.getMaxAnisotropy()) : 1;
      this.rearInsertTextures.set(id, texture);
      material.map = texture;
      material.needsUpdate = true;
    }, undefined, () => {
      this.pendingRearInsertLoads.delete(id);
    });
  }

  private makeDecorationGroup(id: ThemeId): THREE.Group {
    const group = new THREE.Group();
    group.visible = id === this.currentTheme;
    group.renderOrder = -2;
    this.themeDecor.set(id, group);
    this.scene.add(group);
    return group;
  }

  private seededPoints(seed: number, count: number, width: number, height: number): THREE.Vector3[] {
    const positions: THREE.Vector3[] = [];
    const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    while (positions.length < count) {
      const x = (random() - 0.5) * width;
      const y = (random() - 0.5) * height;
      if (Math.abs(x) < 5.05 && Math.abs(y) < 6.5) continue;
      positions.push(new THREE.Vector3(x, y, -2.4));
    }
    return positions;
  }

  private addPoints(group: THREE.Group, points: THREE.Vector3[], color: number, size: number, opacity: number): void {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.PointsMaterial({ color, size, transparent: true, opacity, sizeAttenuation: true, depthWrite: false });
    this.geometries.add(geometry); this.materials.add(material);
    group.add(new THREE.Points(geometry, material));
  }

  private addLine(group: THREE.Group, points: THREE.Vector3[], color: number, opacity = 0.8): void {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: false });
    this.geometries.add(geometry); this.materials.add(material);
    group.add(new THREE.Line(geometry, material));
  }

  private addSeaweed(group: THREE.Group, x: number, y: number, color: number): void {
    for (let stem = -1; stem <= 1; stem++) {
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= 12; i++) points.push(new THREE.Vector3(x + stem * 0.15 + Math.sin(i * 0.35 + stem) * 0.17, y + i * 0.15, -2.0));
      this.addLine(group, points, color, 0.86);
    }
  }

  private addStar(group: THREE.Group, x: number, y: number): void {
    this.addLine(group, [new THREE.Vector3(x - 0.16, y, -2.15), new THREE.Vector3(x + 0.16, y, -2.15)], 0xf5efff);
    this.addLine(group, [new THREE.Vector3(x, y - 0.16, -2.15), new THREE.Vector3(x, y + 0.16, -2.15)], 0xf5efff);
  }

  private addReeds(group: THREE.Group, x: number, y: number): void {
    for (let stalk = -2; stalk <= 2; stalk++) {
      const start = new THREE.Vector3(x + stalk * 0.12, y, -2.05);
      const tip = new THREE.Vector3(x + stalk * 0.23 + (stalk % 2) * 0.1, y + 1.15 + Math.abs(stalk) * 0.12, -2.05);
      this.addLine(group, [start, tip], 0x688b4e, 0.92);
      for (const side of [-1, 1]) {
        const mid = start.clone().lerp(tip, 0.45 + (side + 1) * 0.12);
        const leaf = mid.clone().add(new THREE.Vector3(side * 0.36, 0.18, 0));
        this.addLine(group, [mid, leaf], 0x85a75b, 0.9);
      }
    }
  }

  private addLilyPad(group: THREE.Group, x: number, y: number): void {
    const pad = new THREE.Mesh(new THREE.CircleGeometry(0.36, 24, 0.38, Math.PI * 1.72), this.standard(0x789956, 0.42, 0));
    pad.position.set(x, y, -2.02);
    this.trackMesh(pad);
    group.add(pad);
  }

  private trackMesh(mesh: THREE.Mesh): void {
    this.geometries.add(mesh.geometry);
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) this.materials.add(material);
  }

  private clearGroup(group: THREE.Group): void {
    for (const child of [...group.children]) {
      group.remove(child);
      child.traverse(object => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh) return;
        const geometry = mesh.geometry;
        if (geometry && geometry !== this.ringGeometry) { geometry.dispose(); this.geometries.delete(geometry); }
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const material of mats) {
          material.dispose();
          this.materials.delete(material);
        }
      });
    }
    const live = this.materials;
    for (let i = this.themeColors.length - 1; i >= 0; i--) if (!live.has(this.themeColors[i].material)) this.themeColors.splice(i, 1);
  }

  private box(group: THREE.Group, x: number, y: number, z: number, material: THREE.Material, at: [number, number, number]): THREE.Mesh {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(x, y, z), material);
    mesh.position.set(...at);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    this.geometries.add(mesh.geometry);
    return mesh;
  }

  private cylinder(group: THREE.Group, top: number, bottom: number, height: number, segments: number, material: THREE.Material, at: [number, number, number]): THREE.Mesh {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, segments), material);
    mesh.position.set(...at); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); this.geometries.add(mesh.geometry); return mesh;
  }

  private sphere(group: THREE.Group, radius: number, width: number, height: number, material: THREE.Material, at: [number, number, number]): THREE.Mesh {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, width, height), material);
    mesh.position.set(...at); mesh.castShadow = true; group.add(mesh); this.geometries.add(mesh.geometry); return mesh;
  }

  private physical(color: number, opacity: number, roughness: number): THREE.MeshPhysicalMaterial {
    const material = new THREE.MeshPhysicalMaterial({ color, transparent: opacity < 1, opacity, roughness, metalness: 0.04, clearcoat: 0.85, clearcoatRoughness: 0.12, depthWrite: opacity > 0.5 });
    this.materials.add(material);
    return material;
  }

  private bindThemeColor(material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial, key: keyof ReturnType<typeof theme>['colors']): void {
    this.themeColors.push({ material, key });
  }

  private standard(color: number, roughness: number, metalness: number, transparent = false, opacity = 1): THREE.MeshStandardMaterial {
    const material = new THREE.MeshStandardMaterial({ color, roughness, metalness, transparent, opacity, depthWrite: opacity > 0.5 });
    this.materials.add(material);
    return material;
  }
}
